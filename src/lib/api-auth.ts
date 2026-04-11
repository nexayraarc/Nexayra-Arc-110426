import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "./firebase-admin";

export async function verifyAuth(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) {
    return { error: NextResponse.json({ ok: false, message: "No auth token provided." }, { status: 401 }) };
  }
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return { uid: decoded.uid, email: decoded.email };
  } catch {
    return { error: NextResponse.json({ ok: false, message: "Invalid or expired token." }, { status: 401 }) };
  }
}
