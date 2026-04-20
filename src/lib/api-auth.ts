import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "./firebase-admin";
import { getUserRole, type UserRole } from "./roles";

export async function verifyAuth(req: NextRequest): Promise<
  | { error: NextResponse }
  | { uid: string; email: string | undefined; role: UserRole }
> {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "");
  
  if (!token) {
    return { error: NextResponse.json({ ok: false, message: "No auth token provided." }, { status: 401 }) };
  }
  
  try {
    if (!adminAuth) {
      console.error("Auth verification failed: adminAuth not initialized");
      throw new Error("Firebase Admin Auth not initialized. Check your environment variables.");
    }
    
    let decoded;
    try {
      decoded = await adminAuth.verifyIdToken(token);
    } catch (verifyErr: any) {
      console.error("Token verification failed:", {
        errorCode: verifyErr.code,
        errorMessage: verifyErr.message,
        tokenLength: token.length,
      });
      throw verifyErr;
    }
    
    const role = await getUserRole(decoded.uid);
    return { uid: decoded.uid, email: decoded.email, role };
  } catch (err: any) {
    console.error("Auth verification error:", {
      errorMessage: err.message,
      errorCode: err.code,
    });
    return { error: NextResponse.json({ ok: false, message: "Invalid or expired token." }, { status: 401 }) };
  }
}

export function requireAccountsWrite(auth: { role: UserRole }) {
  if (auth.role !== "admin" && auth.role !== "accounts") {
    return NextResponse.json({ ok: false, message: "Forbidden: accounts access required." }, { status: 403 });
  }
  return null;
}

export function checkFirebaseInit() {
  if (!adminDb || !adminAuth) {
    return NextResponse.json(
      { ok: false, message: "Server not ready: Firebase Admin SDK not initialized. Check environment variables." },
      { status: 503 }
    );
  }
  return null;
}