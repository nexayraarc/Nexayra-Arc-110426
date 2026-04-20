import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/api-auth";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if ("error" in authResult) return authResult.error;
    const body = await req.json();
    const counterRef = adminDb.collection("counters").doc("taxInvoice");
    const num = await adminDb.runTransaction(async (t: any) => {
      const snap = await t.get(counterRef);
      const current = snap.exists ? (snap.data()?.current || 1000) : 1000;
      const next = current + 1;
      t.set(counterRef, { current: next }, { merge: true });
      return next;
    });
    const invoiceNo = `INV-NEX-${num}`;
    const data = { ...body, invoiceNo, createdBy: authResult.email || "", createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() };
    await adminDb.collection("taxInvoices").doc(invoiceNo.replace(/[^\w\-]/g, "_")).set(data);
    // Auto-mirror into accounts invoices collection
    try {
      await adminDb.collection("invoices").add({
        invoiceNo,
        clientName: data.clientName || "",
        total: Number(data.total || 0),
        date: data.date || "",
        dueDate: data.dueDate || "",
        projectId: "",
        sourceTaxInvoiceId: invoiceNo.replace(/[^\w\-]/g, "_"),
        createdBy: authResult.email || "",
        createdAt: FieldValue.serverTimestamp(),
      });
    } catch (mirrorErr) {
      console.warn("Failed to mirror tax invoice to accounts:", mirrorErr);
    }
    return NextResponse.json({ ok: true, invoice: { ...data, createdAt: new Date().toISOString() } });
  } catch (err: any) {
    console.error("TaxInvoice POST error:", err);
    return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if ("error" in authResult) return authResult.error;
    const snap = await adminDb.collection("taxInvoices").orderBy("createdAt", "desc").get();
    const invoices = snap.docs.map((d: any) => {
      const data = d.data();
      return { ...data, _docId: d.id, createdAt: data.createdAt?.toDate?.()?.toISOString() || null };
    });
    return NextResponse.json({ ok: true, invoices });
  } catch (err: any) {
    console.error("TaxInvoice GET error:", err);
    return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if ("error" in authResult) return authResult.error;
    const body = await req.json();
    const { invoiceNo, ...updates } = body;
    if (!invoiceNo) return NextResponse.json({ ok: false, message: "Missing invoiceNo" }, { status: 400 });
    const docId = invoiceNo.replace(/[^\w\-]/g, "_");
    const docRef = adminDb.collection("taxInvoices").doc(docId);
    const docSnap = await docRef.get();
    if (!docSnap.exists) return NextResponse.json({ ok: false, message: `Invoice ${invoiceNo} not found.` }, { status: 404 });
    await docRef.set({ ...updates, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("TaxInvoice PUT error:", err);
    return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
  }
}