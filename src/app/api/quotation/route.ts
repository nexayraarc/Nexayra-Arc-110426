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
    const counterRef = adminDb.collection("counters").doc("quotation");
    const num = await adminDb.runTransaction(async (t: FirebaseFirestore.Transaction) => {
      const snap = await t.get(counterRef);
      const current = snap.exists ? (snap.data()?.current || 1054) : 1054;
      const next = current + 1;
      t.set(counterRef, { current: next }, { merge: true });
      return next;
    });
    const quotationNo = `QTN-NEX-${num}`;
    const data = { ...body, quotationNo, createdBy: authResult.email || "", createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() };
    await adminDb.collection("quotations").doc(quotationNo.replace(/[^\w\-]/g, "_")).set(data);
    return NextResponse.json({ ok: true, quotation: { ...data, createdAt: new Date().toISOString() } });
  } catch (err: any) {
    console.error("Quotation POST error:", err);
    return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const fbCheck = checkFirebaseInit();
  if (fbCheck) return fbCheck;
  try {
    const authResult = await verifyAuth(req);
    if ("error" in authResult) return authResult.error;
    const snap = await adminDb.collection("quotations").orderBy("createdAt", "desc").get();
    const quotations = snap.docs.map((d) => {
      const data = d.data();
      return { ...data, _docId: d.id, createdAt: data.createdAt?.toDate?.()?.toISOString() || null };
    });
    return NextResponse.json({ ok: true, quotations });
  } catch (err: any) {
    console.error("Quotation GET error:", err);
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
    const { quotationNo, updatedQuotationNo, ...updates } = body;
    if (!quotationNo) return NextResponse.json({ ok: false, message: "Missing quotationNo" }, { status: 400 });
    const docId = quotationNo.replace(/[^\w\-]/g, "_");
    const docRef = adminDb.collection("quotations").doc(docId);
    const docSnap = await docRef.get();
    const updateData = updatedQuotationNo ? { ...updates, quotationNo: updatedQuotationNo, updatedAt: FieldValue.serverTimestamp() } : { ...updates, updatedAt: FieldValue.serverTimestamp() };
    if (!docSnap.exists) return NextResponse.json({ ok: false, message: `Quotation ${quotationNo} not found.` }, { status: 404 });
    await docRef.set(updateData, { merge: true });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Quotation PUT error:", err);
    return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
  }
}
