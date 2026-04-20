import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, checkFirebaseInit } from "@/lib/api-auth";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: NextRequest) {
  const fbCheck = checkFirebaseInit();
  if (fbCheck) return fbCheck;
  try {
    const authResult = await verifyAuth(req);
    if ("error" in authResult) return authResult.error;
    const body = await req.json();
    const counterRef = adminDb.collection("counters").doc("receiverCopy");
    const num = await adminDb.runTransaction(async (t) => {
      const snap = await t.get(counterRef);
      const current = snap.exists ? (snap.data()?.current || 1000) : 1000;
      const next = current + 1;
      t.set(counterRef, { current: next }, { merge: true });
      return next;
    });
    const documentNo = `RC-NEX-${num}`;
    const data = { ...body, documentNo, createdBy: authResult.email || "", createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() };
    await adminDb.collection("receiverCopies").doc(documentNo.replace(/[^\w\-]/g, "_")).set(data);
    return NextResponse.json({ ok: true, receiverCopy: { ...data, createdAt: new Date().toISOString() } });
  } catch (err: any) {
    console.error("ReceiverCopy POST error:", err);
    return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const fbCheck = checkFirebaseInit();
  if (fbCheck) return fbCheck;
  try {
    const authResult = await verifyAuth(req);
    if ("error" in authResult) return authResult.error;
    const snap = await adminDb.collection("receiverCopies").orderBy("createdAt", "desc").get();
    const receiverCopies = snap.docs.map((d) => {
      const data = d.data();
      return { ...data, _docId: d.id, createdAt: data.createdAt?.toDate?.()?.toISOString() || null };
    });
    return NextResponse.json({ ok: true, receiverCopies });
  } catch (err: any) {
    console.error("ReceiverCopy GET error:", err);
    return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const fbCheck = checkFirebaseInit();
  if (fbCheck) return fbCheck;
  try {
    const authResult = await verifyAuth(req);
    if ("error" in authResult) return authResult.error;
    const body = await req.json();
    const { documentNo, updatedDocumentNo, ...updates } = body;
    if (!documentNo) return NextResponse.json({ ok: false, message: "Missing documentNo" }, { status: 400 });
    const docId = documentNo.replace(/[^\w\-]/g, "_");
    const docRef = adminDb.collection("receiverCopies").doc(docId);
    const docSnap = await docRef.get();
    const updateData = updatedDocumentNo ? { ...updates, documentNo: updatedDocumentNo, updatedAt: FieldValue.serverTimestamp() } : { ...updates, updatedAt: FieldValue.serverTimestamp() };
    if (!docSnap.exists) return NextResponse.json({ ok: false, message: `Receipt ${documentNo} not found.` }, { status: 404 });
    await docRef.set(updateData, { merge: true });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("ReceiverCopy PUT error:", err);
    return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
  }
}
