import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "./firebase-admin";
import { getUserRole, type UserRole } from "./roles";

export function checkFirebaseInit() {
  try {
    if (!adminAuth) {
      return NextResponse.json({ ok: false, message: "Firebase Admin not initialized." }, { status: 503 });
    }
  } catch (err) {
    return NextResponse.json({ ok: false, message: "Firebase Admin not initialized." }, { status: 503 });
  }
  return null;
}

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
    const decoded = await adminAuth.verifyIdToken(token);
    let role: UserRole = "viewer";
    try { role = await getUserRole(decoded.uid); } catch {}
    return { uid: decoded.uid, email: decoded.email, role };
  } catch (err: any) {
    const msg = err?.message || "Invalid or expired token.";
    console.error("🔥 verifyAuth error:", msg);
    // Return 503 if Firebase Admin isn't initialized, 401 if token is bad
    const status = msg.includes("not initialized") ? 503 : 401;
    return { error: NextResponse.json({ ok: false, message: msg }, { status }) };
  }
}

export function requireAccountsWrite(auth: { role: UserRole }) {
  if (auth.role !== "admin" && auth.role !== "accounts") {
    return NextResponse.json({ ok: false, message: "Forbidden: accounts access required." }, { status: 403 });
  }
  return null;
}