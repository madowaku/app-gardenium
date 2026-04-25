import { Request, Response, NextFunction } from "express";
import { adminAuth, adminDb, getAdminAuthForProject } from "./admin";
import { User } from "../../types/appSproutTypes";

export interface AuthenticatedRequest extends Request {
  user?: User;
  uid?: string;
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
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    
    // Debug log for authentication in development
    if (process.env.NODE_ENV !== 'production') {
      console.log("[Auth Debug] Token Verified:", {
        uid: decodedToken.uid,
        email: decodedToken.email,
        aud: decodedToken.aud,
        iss: decodedToken.iss,
        adminProjectId: (adminAuth.app.options as any).projectId
      });
    }

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
  } catch (error: any) {
    const isDev = process.env.NODE_ENV !== 'production';
    if (isDev) {
      console.error("Auth Error (Token verification failed):", {
        message: error?.message,
        code: error?.code,
        adminProjectId: (adminAuth.app.options as any).projectId
      });
    }
    res.status(401).json({ 
      error: "Unauthorized: Invalid token",
      message: isDev ? error?.message : undefined
    });
  }
}
