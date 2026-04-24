import { Request, Response, NextFunction } from "express";
import { adminAuth, adminDb, getAdminAuthForProject } from "./admin";
import { User } from "../../types/appSproutTypes";

export interface AuthenticatedRequest extends Request {
  user?: User;
  uid?: string;
}

function getTokenAudience(idToken: string): string | undefined {
  try {
    const [, payload] = idToken.split(".");
    if (!payload) return undefined;

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = Buffer.from(normalized, "base64").toString("utf8");
    const parsed = JSON.parse(json);
    return typeof parsed.aud === "string" ? parsed.aud : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Middleware to verify Firebase ID Token and attach User data to request.
 */
export async function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: "Unauthorized: Missing token" });
  }

  const idToken = authHeader.split('Bearer ')[1];
  try {
    const tokenAudience = getTokenAudience(idToken);
    const decodedToken = await getAdminAuthForProject(tokenAudience).verifyIdToken(idToken);
    const uid = decodedToken.uid;
    
    const userDoc = await adminDb.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      const bootstrapUser: any = {
        id: uid,
        name: decodedToken.name || decodedToken.email || 'Sprout User',
        avatarUrl: decodedToken.picture || '',
        bio: '',
        role: 'user',
        plan: 'free',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await adminDb.collection('users').doc(uid).set(bootstrapUser, { merge: true });
      req.uid = uid;
      req.user = bootstrapUser as User;
      next();
      return;
    }

    req.uid = uid;
    req.user = { id: userDoc.id, ...userDoc.data() } as User;
    next();
  } catch (error) {
    try {
      const decodedToken = await adminAuth.verifyIdToken(idToken);
      const uid = decodedToken.uid;
      const userDoc = await adminDb.collection('users').doc(uid).get();

      req.uid = uid;
      req.user = userDoc.exists
        ? ({ id: userDoc.id, ...userDoc.data() } as User)
        : ({
            id: uid,
            name: decodedToken.name || decodedToken.email || 'Sprout User',
            avatarUrl: decodedToken.picture || '',
            bio: '',
            role: 'user',
            plan: 'free',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          } as User);
      next();
      return;
    } catch (fallbackError) {
      console.error("Auth Error:", fallbackError);
      res.status(401).json({ error: "Unauthorized: Invalid token" });
    }
  }
}
