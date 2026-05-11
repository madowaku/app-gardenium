import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

import express from "express";
import type { Request } from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs/promises";
import sharp from "sharp";
import cors from "cors";
import bodyParser from "body-parser";
import Stripe from "stripe";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { FieldValue } from "firebase-admin/firestore";
import { authenticate, AuthenticatedRequest } from "./src/lib/server/auth";
import { adminDb, loadFirebaseConfig } from "./src/lib/server/admin";
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
import { listAgentSuggestions, runGrowthReview } from "./src/lib/server/growthAgentService";
import { applySuggestion, dismissSuggestion } from "./src/lib/server/agentSuggestionService";

const app = express();
const PORT = Number(process.env.PORT || 3000);

// Setup Stripe
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: "2025-01-27" as any })
  : null;

function htmlEscape(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function routeLanguage(pathname: string) {
  const first = pathname.split("/").filter(Boolean)[0];
  return first === "ja" ? "ja" : "en";
}

function stripRouteLanguage(pathname: string) {
  return pathname.replace(/^\/(en|ja)(?=\/|$)/, "") || "/";
}

function localizedPath(pathname: string, lang: "en" | "ja") {
  const stripped = stripRouteLanguage(pathname);
  return stripped === "/" ? `/${lang}` : `/${lang}${stripped}`;
}

function normalizeSiteUrl(rawUrl?: string | null) {
  return rawUrl?.replace(/\/$/, "") || "";
}

function getRequestSiteUrl(req: Request) {
  const forwardedProto = req.header("x-forwarded-proto")?.split(",")[0]?.trim();
  const forwardedHost = req.header("x-forwarded-host")?.split(",")[0]?.trim();
  const protocol = forwardedProto || req.protocol || "https";
  const host = forwardedHost || req.get("host");

  if (!host) {
    return normalizeSiteUrl(process.env.PUBLIC_SITE_URL) || "https://app-gardenium.com";
  }

  return `${protocol}://${host}`.replace(/\/$/, "");
}

function getFirestoreRestValue(field: any): any {
  if (!field || typeof field !== "object") return undefined;
  if ("stringValue" in field) return field.stringValue;
  if ("integerValue" in field) return Number(field.integerValue);
  if ("doubleValue" in field) return Number(field.doubleValue);
  if ("booleanValue" in field) return Boolean(field.booleanValue);
  if ("timestampValue" in field) return field.timestampValue;
  if ("arrayValue" in field) return (field.arrayValue.values || []).map(getFirestoreRestValue);
  if ("mapValue" in field) {
    return Object.fromEntries(
      Object.entries(field.mapValue.fields || {}).map(([key, value]) => [key, getFirestoreRestValue(value)])
    );
  }
  return undefined;
}

async function fetchPublicIdeaForSeo(ideaId: string) {
  const ideas = await fetchPublicIdeasForSeo();
  return ideas.find((idea: any) => idea.id === ideaId) || null;
}

async function fetchPublicIdeasForSeo(limit = 500) {
  try {
    const config = loadFirebaseConfig() as any;
    if (!config.projectId || !config.apiKey || !config.firestoreDatabaseId) return [];
    const url = new URL(
      `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents:runQuery`
    );
    url.searchParams.set("key", config.apiKey);
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: "ideas" }],
          where: {
            fieldFilter: {
              field: { fieldPath: "visibility" },
              op: "EQUAL",
              value: { stringValue: "public" },
            },
          },
          limit,
        },
      }),
    });
    if (!response.ok) return [];
    const payload = await response.json();
    return (payload || [])
      .map((row: any) => {
        const doc = row.document;
        if (!doc) return null;
        const fields = doc.fields || {};
        const id = String(doc.name || "").split("/").pop();
        return {
          id,
          title: getFirestoreRestValue(fields.title) as string | undefined,
          oneLineSummary: getFirestoreRestValue(fields.oneLineSummary) as string | undefined,
          screenshots: getFirestoreRestValue(fields.screenshots) as string[] | undefined,
          visibility: getFirestoreRestValue(fields.visibility) as string | undefined,
          updatedAt: getFirestoreRestValue(fields.updatedAt) as string | undefined,
          createdAt: getFirestoreRestValue(fields.createdAt) as string | undefined,
        };
      })
      .filter(Boolean)
      .filter((idea: any) => idea.id && idea.visibility === "public");
  } catch {
    return [];
  }
}

function renderOgSvg(title: string, description: string) {
  const safeTitle = htmlEscape(title).slice(0, 120);
  const safeDescription = htmlEscape(description).slice(0, 180);
  const titleLines = safeTitle.match(/.{1,24}(\s|$)|.{1,24}/g)?.slice(0, 3) || [safeTitle];
  const descLines = safeDescription.match(/.{1,54}(\s|$)|.{1,54}/g)?.slice(0, 2) || [safeDescription];

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#fffaf0"/>
  <rect x="54" y="54" width="1092" height="522" rx="36" fill="#ffffff" stroke="#e7ddca" stroke-width="2"/>
  <rect x="54" y="54" width="1092" height="12" rx="6" fill="#36b37e"/>
  <text x="98" y="130" font-family="Inter, Arial, sans-serif" font-size="30" font-weight="700" fill="#36b37e">App Gardenium</text>
  <text x="98" y="214" font-family="Georgia, 'Times New Roman', serif" font-size="64" font-weight="700" fill="#26211d">
    ${titleLines.map((line, index) => `<tspan x="98" dy="${index === 0 ? 0 : 74}">${line.trim()}</tspan>`).join("")}
  </text>
  <text x="100" y="470" font-family="Inter, Arial, sans-serif" font-size="30" fill="#6c6258">
    ${descLines.map((line, index) => `<tspan x="100" dy="${index === 0 ? 0 : 40}">${line.trim()}</tspan>`).join("")}
  </text>
  <text x="100" y="542" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="700" fill="#f05a3b">App idea growing with the community</text>
</svg>`;
}

async function renderOgPng(title: string, description: string) {
  const svg = renderOgSvg(title, description);
  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function renderSitemapXml(siteUrl: string) {
  const staticPaths = ["/", "/ideas", "/pricing", "/salon", "/terms", "/privacy"];
  const ideas = await fetchPublicIdeasForSeo();
  const entries: string[] = [];

  for (const pathValue of staticPaths) {
    for (const lang of ["en", "ja"] as const) {
      const loc = `${siteUrl}${localizedPath(pathValue, lang)}`;
      entries.push(`  <url>
    <loc>${htmlEscape(loc)}</loc>
    <xhtml:link rel="alternate" hreflang="en" href="${htmlEscape(`${siteUrl}${localizedPath(pathValue, "en")}`)}" />
    <xhtml:link rel="alternate" hreflang="ja" href="${htmlEscape(`${siteUrl}${localizedPath(pathValue, "ja")}`)}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${htmlEscape(pathValue === "/" ? `${siteUrl}/` : `${siteUrl}${localizedPath(pathValue, "en")}`)}" />
  </url>`);
    }
  }

  for (const idea of ideas) {
    const pathValue = `/ideas/${idea.id}`;
    const lastmod = idea.updatedAt || idea.createdAt;
    for (const lang of ["en", "ja"] as const) {
      entries.push(`  <url>
    <loc>${htmlEscape(`${siteUrl}${localizedPath(pathValue, lang)}`)}</loc>
    ${lastmod ? `<lastmod>${htmlEscape(new Date(lastmod).toISOString())}</lastmod>` : ""}
    <xhtml:link rel="alternate" hreflang="en" href="${htmlEscape(`${siteUrl}${localizedPath(pathValue, "en")}`)}" />
    <xhtml:link rel="alternate" hreflang="ja" href="${htmlEscape(`${siteUrl}${localizedPath(pathValue, "ja")}`)}" />
  </url>`);
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join("\n")}
</urlset>`;
}

function renderRobotsTxt(siteUrl: string) {
  return `User-agent: *
Allow: /
Disallow: /en/login
Disallow: /ja/login
Disallow: /en/mypage
Disallow: /ja/mypage
Disallow: /en/membership
Disallow: /ja/membership
Disallow: /en/ideas/new
Disallow: /ja/ideas/new
Disallow: /en/tester-calls/new
Disallow: /ja/tester-calls/new
Disallow: /en/admin/
Disallow: /ja/admin/
Disallow: /en/billing/
Disallow: /ja/billing/
Disallow: /en/commerce
Disallow: /ja/commerce

Sitemap: ${siteUrl}/sitemap.xml
`;
}

async function consumeAiHelperQuota(req: AuthenticatedRequest, res: express.Response) {
  const user = await ensureMonthlyUsage(req.uid!, req.user!);
  const { allowed, remaining } = await consumeUsage(req.uid!, user, "aiSummaries");

  if (!allowed) {
    res.status(429).json({
      error: "Daily beta AI helper limit reached",
      remaining: 0,
      limit: user.plan === "pro" ? 50 : user.plan === "supporter" ? 10 : 3,
    });
    return null;
  }

  return { user, remaining };
}

async function renderIndexWithSeo(indexPath: string, requestPath: string, siteUrl: string) {
  let html = await fs.readFile(indexPath, "utf-8");
  const lang = routeLanguage(requestPath);
  const pathOnly = requestPath.split("?")[0];
  const stripped = stripRouteLanguage(pathOnly);
  const canonical = `${siteUrl}${localizedPath(stripped, lang)}`;
  const english = `${siteUrl}${localizedPath(stripped, "en")}`;
  const japanese = `${siteUrl}${localizedPath(stripped, "ja")}`;
  const isNoindex = [
    "/login",
    "/mypage",
    "/membership",
    "/ideas/new",
    "/tester-calls/new",
    "/admin/boosts",
    "/billing/success",
    "/billing/cancel",
    "/commerce",
  ].some(path => stripped === path || stripped.startsWith(`${path}/`));

  let title = lang === "ja"
    ? "App Gardenium | アプリのアイデアを、みんなで育てる"
    : "App Gardenium | Grow app ideas together";
  let description = lang === "ja"
    ? "「あったらいいな」のアプリ案を投稿し、フィードバックや初期テスターと出会いながら形にしていくコミュニティです。"
    : "Plant tiny app ideas, get feedback, find early testers, and grow them into real products with makers and early users.";
  let image = `${siteUrl}/og-image.png`;

  const ideaMatch = stripped.match(/^\/ideas\/([^/]+)$/);
  if (ideaMatch) {
    const idea = await fetchPublicIdeaForSeo(ideaMatch[1]);
    if (idea?.title) {
      title = `${idea.title} | App Gardenium`;
    }
    if (idea?.oneLineSummary) {
      description = idea.oneLineSummary;
    }
    if (idea?.title) {
      image = `${siteUrl}/api/og/ideas/${encodeURIComponent(ideaMatch[1])}.png`;
    }
  }

  const escapedTitle = htmlEscape(title);
  const escapedDescription = htmlEscape(description);
  const escapedCanonical = htmlEscape(canonical);
  const escapedImage = htmlEscape(image);

  html = html
    .replace(/<html lang="[^"]*">/, `<html lang="${lang}">`)
    .replace(/<title>.*?<\/title>/, `<title>${escapedTitle}</title>`)
    .replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${escapedDescription}" />`)
    .replace(/<meta name="robots" content="[^"]*" \/>/, `<meta name="robots" content="${isNoindex ? "noindex, nofollow" : "index, follow"}" />`)
    .replace(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${escapedCanonical}" />`)
    .replace(/<link rel="alternate" hreflang="en" href="[^"]*" \/>/, `<link rel="alternate" hreflang="en" href="${htmlEscape(english)}" />`)
    .replace(/<link rel="alternate" hreflang="ja" href="[^"]*" \/>/, `<link rel="alternate" hreflang="ja" href="${htmlEscape(japanese)}" />`)
    .replace(/<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${escapedCanonical}" />`)
    .replace(/<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${escapedTitle}" />`)
    .replace(/<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${escapedDescription}" />`)
    .replace(/<meta property="og:image" content="[^"]*" \/>/, `<meta property="og:image" content="${escapedImage}" />`)
    .replace(/<meta property="twitter:url" content="[^"]*" \/>/, `<meta property="twitter:url" content="${escapedCanonical}" />`)
    .replace(/<meta property="twitter:title" content="[^"]*" \/>/, `<meta property="twitter:title" content="${escapedTitle}" />`)
    .replace(/<meta property="twitter:description" content="[^"]*" \/>/, `<meta property="twitter:description" content="${escapedDescription}" />`)
    .replace(/<meta property="twitter:image" content="[^"]*" \/>/, `<meta property="twitter:image" content="${escapedImage}" />`);

  return html;
}

async function startServer() {
  // Cloud Run terminates traffic behind a single trusted proxy hop.
  // Avoid `true` here because express-rate-limit treats it as overly permissive
  // for IP-based limiting and will raise ERR_ERL_PERMISSIVE_TRUST_PROXY.
  app.set("trust proxy", 1);

  // 1. Security Headers (Helmet)
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://js.stripe.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: ["'self'", "https://*.googleapis.com", "https://*.firebaseio.com", "wss://*.firebaseio.com", "https://api.stripe.com", "https://securetoken.googleapis.com", "https://identitytoolkit.googleapis.com", "https://*.firebaseapp.com"],
        frameSrc: ["'self'", "https://js.stripe.com", "https://hooks.stripe.com", "https://*.firebaseapp.com"],
      }
    }
  }));

  // 2. CORS Restrictions
  const ALLOWED_ORIGINS = [
    'https://app-gardenium.com',
    'https://www.app-gardenium.com',
    'https://app-gardenium-21754549540.asia-east1.run.app',
    ...(process.env.NODE_ENV !== 'production' ? ['http://localhost:3000', 'http://localhost:5173'] : [])
  ];

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  }));

  // 3. Rate Limiting
  const globalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, message: "Too many requests, please try again later." });
  app.use('/api', globalLimiter);

  const aiLimiter = rateLimit({ windowMs: 60 * 1000, max: 20, message: "AI rate limit exceeded." });
  app.use('/api/ai/', aiLimiter);
  app.use('/api/agents/', aiLimiter);

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

  app.get("/sitemap.xml", async (req, res) => {
    res.type("application/xml").send(await renderSitemapXml(getRequestSiteUrl(req)));
  });

  app.get("/robots.txt", (req, res) => {
    res.type("text/plain").send(renderRobotsTxt(getRequestSiteUrl(req)));
  });

  app.get("/api/og/ideas/:ideaId.svg", async (req, res) => {
    const idea = await fetchPublicIdeaForSeo(req.params.ideaId);
    const title = idea?.title || "App idea growing on App Gardenium";
    const description = idea?.oneLineSummary || "Plant tiny app ideas, get feedback, find early testers, and grow them into real products.";
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.type("image/svg+xml").send(renderOgSvg(title, description));
  });

  app.get("/api/og/ideas/:ideaId.png", async (req, res) => {
    const idea = await fetchPublicIdeaForSeo(req.params.ideaId);
    const title = idea?.title || "App idea growing on App Gardenium";
    const description = idea?.oneLineSummary || "Plant tiny app ideas, get feedback, find early testers, and grow them into real products.";
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.type("image/png").send(await renderOgPng(title, description));
  });

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
      try {
        const user = await ensureMonthlyTopUps(
          req.uid!,
          await ensureMonthlyUsage(req.uid!, req.user!)
        );

        const limits = {
          aiSummaries: user.plan === "pro" ? 50 : user.plan === "supporter" ? 10 : 3,
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
      } catch (error: any) {
        console.error("Membership status error:", error);
        return res.status(500).json({ error: error.message || "Failed to load membership status" });
      }
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
        const quota = await consumeAiHelperQuota(req, res);
        if (!quota) {
          return;
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

        return res.json({ summary, remaining: quota.remaining });
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
        const quota = await consumeAiHelperQuota(req, res);
        if (!quota) {
          return;
        }

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
        return res.json({ ...enhanced, remaining: quota.remaining });
      } catch (error: any) {
        console.error("AI enhance error:", error);
        return res.status(500).json({ error: error.message || "Failed to enhance idea" });
      }
    }
  );

  app.post(
    "/api/ai/translate",
    authenticate,
    async (req: AuthenticatedRequest, res) => {
      try {
        const quota = await consumeAiHelperQuota(req, res);
        if (!quota) {
          return;
        }

        const { targetLang, textData } = req.body;
        const ai = getAIService();
        
        const prompt = `Translate the following text fields to ${targetLang}. Preserve the JSON structure exactly. Do not translate the tags array elements unless necessary, but translate the rest.
        JSON:
        ${JSON.stringify(textData, null, 2)}`;

        const response = await ai.models.generateContent({
          model: getAIModelForTask('translate_content'),
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          }
        });

        const translatedData = JSON.parse(response.text.trim());
        return res.json({ ...translatedData, remaining: quota.remaining });
      } catch (error: any) {
        console.error("Translation error:", error);
        return res.status(500).json({ error: error.message || "Failed to translate content" });
      }
    }
  );

  app.post(
    "/api/ai/moderate-avatar",
    authenticate,
    async (req: AuthenticatedRequest, res) => {
      try {
        const { imageDescription } = req.body;
        if (!imageDescription) {
          return res.json({ safe: true }); // Default to safe if no desc
        }
        
        const ai = getAIService();
        const response = await ai.models.generateContent({
          model: getAIModelForTask('moderate_profile_image'),
          contents: `Analyze this image description and determine if it violates safety guidelines (NSFW, hate speech, illegal acts, extreme violence, etc). Return JSON { "safe": boolean, "reason": "string" }\n\nDescription: ${imageDescription}`,
          config: {
            responseMimeType: "application/json",
          }
        });

        const result = JSON.parse(response.text.trim());
        return res.json(result);
      } catch (error: any) {
        console.error("Avatar moderation error:", error);
        // Fail open if AI fails, to not block users
        return res.json({ safe: true, reason: "moderation_failed" });
      }
    }
  );

  app.post(
    "/api/ai/analyze-report",
    authenticate,
    async (req: AuthenticatedRequest, res) => {
      try {
        const { isPremium, activityData, language } = req.body;
        const task = isPremium ? 'analysis_report_premium' : 'analysis_report';
        const outputLanguage = language === 'en' ? 'English' : 'Japanese';
        
        const ai = getAIService();
        const prompt = `Act as an expert Product Manager. Analyze the following app community activity data and generate a structured JSON report.
        
        Data: ${JSON.stringify(activityData)}
        
        ${isPremium ? 'Provide a deep, strategic analysis with specific actionable advice, potential feature pivots, and a growth strategy.' : 'Provide a brief summary of the activity, highlighting 1-2 positive trends and 1 area for improvement.'}

        Write every user-facing value in ${outputLanguage}. Keep product names and proper nouns as-is when appropriate.
        If the data is sparse, still produce practical, gentle suggestions in ${outputLanguage}.
        
        Return the result as JSON matching this schema:
        {
          "summary": "string",
          "commonRequests": ["string"],
          "concerns": ["string"],
          "nextActions": ["string"]
        }`;

        const response = await ai.models.generateContent({
          model: getAIModelForTask(task),
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          }
        });

        const result = JSON.parse(response.text.trim());
        return res.json(result);
      } catch (error: any) {
        console.error("AI report analysis error:", error);
        return res.status(500).json({ error: error.message || "Failed to generate report" });
      }
    }
  );

  app.get(
    "/api/agents/ideas/:ideaId/suggestions",
    authenticate,
    async (req: AuthenticatedRequest, res) => {
      try {
        const suggestions = await listAgentSuggestions({
          ideaId: req.params.ideaId,
          userId: req.uid!,
        });
        return res.json({ suggestions });
      } catch (error: any) {
        const status = /not found/i.test(error?.message) ? 404 : /owner|cannot|another/i.test(error?.message) ? 403 : 500;
        return res.status(status).json({ error: error.message || "Failed to load suggestions" });
      }
    }
  );

  app.post(
    "/api/agents/growth-review",
    authenticate,
    async (req: AuthenticatedRequest, res) => {
      try {
        const { ideaId, language } = req.body || {};
        if (!ideaId || typeof ideaId !== "string") {
          return res.status(400).json({ error: "ideaId is required" });
        }
        const result = await runGrowthReview({
          ideaId,
          userId: req.uid!,
          language: language === "en" ? "en" : "ja",
        });
        return res.json(result);
      } catch (error: any) {
        const status = /not found/i.test(error?.message) ? 404 : /owner|cannot|another/i.test(error?.message) ? 403 : 500;
        return res.status(status).json({ error: error.message || "Failed to run Growth Agent" });
      }
    }
  );

  app.post(
    "/api/agents/apply-suggestion",
    authenticate,
    async (req: AuthenticatedRequest, res) => {
      try {
        const { suggestionId } = req.body || {};
        if (!suggestionId || typeof suggestionId !== "string") {
          return res.status(400).json({ error: "suggestionId is required" });
        }
        const suggestion = await applySuggestion({ suggestionId, userId: req.uid! });
        return res.json({ suggestion });
      } catch (error: any) {
        const status = /not found/i.test(error?.message) ? 404 : /owner|cannot|another/i.test(error?.message) ? 403 : 400;
        return res.status(status).json({ error: error.message || "Failed to apply suggestion" });
      }
    }
  );

  app.post(
    "/api/agents/dismiss-suggestion",
    authenticate,
    async (req: AuthenticatedRequest, res) => {
      try {
        const { suggestionId } = req.body || {};
        if (!suggestionId || typeof suggestionId !== "string") {
          return res.status(400).json({ error: "suggestionId is required" });
        }
        const suggestion = await dismissSuggestion({ suggestionId, userId: req.uid! });
        return res.json({ suggestion });
      } catch (error: any) {
        const status = /not found/i.test(error?.message) ? 404 : /owner|cannot|another/i.test(error?.message) ? 403 : 400;
        return res.status(status).json({ error: error.message || "Failed to dismiss suggestion" });
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
        if (req.firebaseToken?.email_verified !== true) {
          return res.status(403).json({ error: "Email verification is required" });
        }
        if (typeof payload.title !== "string" || payload.title.length < 1 || payload.title.length > 100) {
          return res.status(400).json({ error: "Invalid title" });
        }
        if (
          typeof payload.oneLineSummary !== "string" ||
          payload.oneLineSummary.length < 1 ||
          payload.oneLineSummary.length > 200
        ) {
          return res.status(400).json({ error: "Invalid one-line summary" });
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
    const indexPath = path.join(distPath, "index.html");
    app.use(express.static(distPath, { index: false }));
    app.get("*", async (req, res) => {
      try {
        res.type("html").send(await renderIndexWithSeo(indexPath, req.path, getRequestSiteUrl(req)));
      } catch (error) {
        console.error("SEO HTML render error:", error);
        res.sendFile(indexPath);
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    
    if (process.env.NODE_ENV !== "production") {
      // Log safe config
      try {
        const config = loadFirebaseConfig();
        console.log("Firebase Config:", {
          projectId: config.projectId,
          authDomain: config.authDomain,
          databaseId: config.firestoreDatabaseId && config.firestoreDatabaseId !== "(default)" 
            ? config.firestoreDatabaseId 
            : "(default)",
        });
      } catch (e) {
        console.log("Firebase Config: Not available or invalid format.");
      }

      console.log(
        stripe
          ? "Stripe initialized"
          : "Stripe not configured; billing endpoints will return 500 until STRIPE_SECRET_KEY is set"
      );
    }
  });
}

startServer().catch((err) => {
  console.error("Server failed to start:", err);
  process.exit(1);
});
