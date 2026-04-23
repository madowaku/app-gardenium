import { Request, Response, NextFunction } from "express";
import { adminAuth, adminDb } from "./admin";
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
    
    const userDoc = await adminDb.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found in database" });
    }

    req.uid = uid;
    req.user = { id: userDoc.id, ...userDoc.data() } as User;
    next();
  } catch (error) {
    console.error("Auth Error:", error);
    res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
}
