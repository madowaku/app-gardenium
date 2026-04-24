import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import bodyParser from "body-parser";
import Stripe from "stripe";
import { FieldValue } from "firebase-admin/firestore";
import { authenticate, AuthenticatedRequest } from "./src/lib/server/auth";
import { adminDb } from "./src/lib/server/admin";
import {
  createCheckoutSession,
  createPortalSession,
  handleStripeEvent,
} from "./src/lib/server/billingService";
import {
  ensureMonthlyUsage,
  consumeUsage,
  hasFeatureAccess,
  ensureMonthlyTopUps,
  consumeTopUp,
} from "./src/lib/server/usageService";
import { getAIModelForTask, getAIService } from "./src/lib/ai/modelRouting";

const app = express();
const PORT = Number(process.env.PORT || 3000);

// Setup Stripe
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: "2025-01-27" as any })
  : null;

async function startServer() {
  app.use(cors());

  // 1. Stripe Webhook (MUST BE BEFORE bodyParser.json())
  app.post(
    "/api/billing/webhook",
    bodyParser.raw({ type: "application/json" }),
    async (req, res) => {
      if (!stripe) {
        return res
          .status(500)
          .send("Stripe is not configured. Set STRIPE_SECRET_KEY in .env.local");
      }

      const sig = req.headers["stripe-signature"];
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!sig || !webhookSecret) {
        return res.status(400).send("Webhook Error: Missing signature or secret");
      }

      try {
        const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
        await handleStripeEvent(event);
        return res.json({ received: true });
      } catch (err: any) {
        console.error(`Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }
    }
  );

  // 2. Standard Middleware
  app.use(bodyParser.json());

  // 3. Billing Endpoints
  app.post(
    "/api/billing/create-checkout-session",
    authenticate,
    async (req: AuthenticatedRequest, res) => {
      if (!stripe) {
        return res.status(500).json({
          error: "Stripe is not configured. Set STRIPE_SECRET_KEY in .env.local",
        });
      }

      try {
        const { productKey } = req.body;
        const validProducts = [
          "supporter",
          "pro",
          "boost_support",
          "extra_activity_report",
          "extra_tester_recruitment",
        ];

        if (!validProducts.includes(productKey)) {
          return res.status(400).json({ error: "Invalid product key" });
        }

        const url = await createCheckoutSession(req.uid!, req.user!, productKey);
        return res.json({ url });
      } catch (error: any) {
        return res.status(500).json({ error: error.message });
      }
    }
  );

  app.post(
    "/api/billing/create-portal-session",
    authenticate,
    async (req: AuthenticatedRequest, res) => {
      if (!stripe) {
        return res.status(500).json({
          error: "Stripe is not configured. Set STRIPE_SECRET_KEY in .env.local",
        });
      }

      try {
        if (!req.user?.stripeCustomerId) {
          return res.status(400).json({ error: "No active customer record" });
        }
        const url = await createPortalSession(req.user.stripeCustomerId);
        return res.json({ url });
      } catch (error: any) {
        return res.status(500).json({ error: error.message });
      }
    }
  );

  // 4. Feature Metadata / Membership Info Helper
  app.get(
    "/api/user/membership-status",
    authenticate,
    async (req: AuthenticatedRequest, res) => {
      const user = await ensureMonthlyTopUps(
        req.uid!,
        await ensureMonthlyUsage(req.uid!, req.user!)
      );

      const limits = {
        aiSummaries: user.plan === "pro" ? 50 : user.plan === "supporter" ? 10 : 0,
        reports: user.plan === "pro" ? 10 : user.plan === "supporter" ? 1 : 0,
      };

      return res.json({
        plan: user.plan,
        status: user.planStatus,
        currentPeriodEnd: user.currentPeriodEnd,
        cancelAtPeriodEnd: user.cancelAtPeriodEnd,
        usage: user.usage,
        topUps: user.topUps || {},
        limits,
        remaining: {
          aiSummaries: Math.max(
            0,
            limits.aiSummaries - (user.usage?.aiSummariesUsed || 0)
          ),
          reports:
            Math.max(0, limits.reports - (user.usage?.reportsUsed || 0)) +
            (user.topUps?.extraActivityReportsRemaining || 0),
        },
        portalEligible: !!user.stripeCustomerId,
      });
    }
  );

  // Sample: Consume Extra Report
  app.post(
    "/api/reports/consume-extra",
    authenticate,
    async (req: AuthenticatedRequest, res) => {
      try {
        const user = req.user!;
        const { allowed, remaining } = await consumeTopUp(
          req.uid!,
          user,
          "extra_activity_report"
        );

        if (!allowed) {
          return res.status(403).json({ error: "No extra reports remaining" });
        }

        return res.json({ success: true, remaining });
      } catch (error: any) {
        return res.status(500).json({ error: error.message });
      }
    }
  );

  // 5. Sample Protected AI Feature: AI Summary
  app.post(
    "/api/ai/generate-summary",
    authenticate,
    async (req: AuthenticatedRequest, res) => {
      try {
        const user = await ensureMonthlyUsage(req.uid!, req.user!);

        if (!hasFeatureAccess(user, ["supporter", "pro"])) {
          return res
            .status(403)
            .json({ error: "Supporter plan required for AI Summaries" });
        }

        const { allowed, remaining } = await consumeUsage(
          req.uid!,
          user,
          "aiSummaries"
        );
        if (!allowed) {
          return res
            .status(429)
            .json({ error: "Monthly AI Summary limit reached" });
        }

        const { text } = req.body;
        const genAI = getAIService();

        const result = await genAI.models.generateContent({
          model: getAIModelForTask("summarize_text"),
          contents: [
            {
              role: "user",
              parts: [{ text: `Summarize this in one sentence: ${text}` }],
            },
          ],
        });

        const summary =
          result.candidates?.[0]?.content?.parts?.[0]?.text || "";

        return res.json({ summary, remaining });
      } catch (error: any) {
        return res.status(500).json({ error: error.message });
      }
    }
  );

  // 6. AI Idea Enhancement
  app.post(
    "/api/ai/enhance-idea",
    authenticate,
    async (req: AuthenticatedRequest, res) => {
      try {
        const { title, oneLineSummary, targetUsers, problemDetails, frustrations, alternatives, minFeatures } = req.body;
        const genAI = getAIService();

        const prompt = `Based on the following seed of an app idea, suggest improvements. Expand on missing details gracefully.
        Title: ${title || ''}
        One Line Summary: ${oneLineSummary || ''}
        Target Users: ${targetUsers || ''}
        Problem Details: ${problemDetails || ''}
        Frustrations: ${frustrations || ''}
        Alternatives: ${alternatives || ''}
        Minimum Features: ${minFeatures || ''}`;

        const result = await genAI.models.generateContent({
          model: getAIModelForTask("idea_polish"),
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT" as any,
              properties: {
                enhancedTitle: { type: "STRING" as any },
                enhancedOneLineSummary: { type: "STRING" as any },
                enhancedProblemDetails: { type: "STRING" as any },
                enhancedAlternatives: { type: "STRING" as any },
                enhancedFrustrations: { type: "STRING" as any },
                enhancedMinFeatures: { type: "STRING" as any },
                enhancedTags: { type: "STRING" as any },
              },
              required: ["enhancedTitle", "enhancedOneLineSummary", "enhancedProblemDetails", "enhancedAlternatives", "enhancedFrustrations", "enhancedMinFeatures", "enhancedTags"],
            },
          },
        });

        const enhanced = JSON.parse(result.candidates?.[0]?.content?.parts?.[0]?.text || "{}");
        return res.json(enhanced);
      } catch (error: any) {
        console.error("AI enhance error:", error);
        return res.status(500).json({ error: error.message || "Failed to enhance idea" });
      }
    }
  );

  // 7. Idea Submission Fallback
  app.post(
    "/api/ideas",
    authenticate,
    async (req: AuthenticatedRequest, res) => {
      try {
        const { ideaId, payload } = req.body || {};
        if (!ideaId || typeof ideaId !== "string") {
          return res.status(400).json({ error: "Invalid ideaId" });
        }
        if (!payload || typeof payload !== "object") {
          return res.status(400).json({ error: "Invalid payload" });
        }

        const safeDoc = {
          ...payload,
          authorId: req.uid,
          supportCount: Number(payload.supportCount ?? 0),
          commentCount: Number(payload.commentCount ?? 0),
          builderReactionCount: Number(payload.builderReactionCount ?? 0),
          releaseStatus: payload.releaseStatus || "none",
          visibility: payload.visibility || "public",
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        };

        await adminDb.collection("ideas").doc(ideaId).set(safeDoc, { merge: false });
        return res.json({ success: true, id: ideaId });
      } catch (error: any) {
        return res.status(500).json({ error: error.message || "Failed to create idea" });
      }
    }
  );

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(
      stripe
        ? "Stripe initialized"
        : "Stripe not configured; billing endpoints will return 500 until STRIPE_SECRET_KEY is set"
    );
  });
}

startServer().catch((err) => {
  console.error("Server failed to start:", err);
  process.exit(1);
});
