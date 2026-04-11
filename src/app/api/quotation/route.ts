import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/api-auth";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if ("error" in authResult) return authResult.error;

    const body = await req.json();

    const counterRef = adminDb.collection("counters").doc("quotation");
    const num = await adminDb.runTransaction(async (t) => {
      const snap = await t.get(counterRef);
      const current = snap.exists ? (snap.data()?.current || 1054) : 1054;
      const next = current + 1;
      t.set(counterRef, { current: next }, { merge: true });
      return next;
    });

    const quotationNo = `QTN-NEX-${num}`;
    const quotationData = {
      ...body,
      quotationNo,
      createdBy: authResult.email || "",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const docId = quotationNo.replace(/[^\w\-]/g, "_");
    await adminDb.collection("quotations").doc(docId).set(quotationData);

    return NextResponse.json({
      ok: true,
      quotation: { ...quotationData, createdAt: new Date().toISOString() },
    });
  } catch (err: any) {
    console.error("Quotation POST error:", err);
    return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if ("error" in authResult) return authResult.error;

    const snap = await adminDb.collection("quotations").orderBy("createdAt", "desc").get();
    const quotations = snap.docs.map((d) => {
      const data = d.data();
      return { ...data, createdAt: data.createdAt?.toDate?.()?.toISOString() || null };
    });

    return NextResponse.json({ ok: true, quotations });
  } catch (err: any) {
    console.error("Quotation GET error:", err);
    return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
  }
}
