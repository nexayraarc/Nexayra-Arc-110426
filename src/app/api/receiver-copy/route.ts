import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/api-auth";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: NextRequest) {
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
    const rcData = {
      ...body,
      documentNo,
      createdBy: authResult.email || "",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const docId = documentNo.replace(/[^\w\-]/g, "_");
    await adminDb.collection("receiverCopies").doc(docId).set(rcData);

    return NextResponse.json({
      ok: true,
      receiverCopy: { ...rcData, createdAt: new Date().toISOString() },
    });
  } catch (err: any) {
    console.error("ReceiverCopy POST error:", err);
    return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if ("error" in authResult) return authResult.error;

    const snap = await adminDb.collection("receiverCopies").orderBy("createdAt", "desc").get();
    const receiverCopies = snap.docs.map((d) => {
      const data = d.data();
      return { ...data, createdAt: data.createdAt?.toDate?.()?.toISOString() || null };
    });

    return NextResponse.json({ ok: true, receiverCopies });
  } catch (err: any) {
    console.error("ReceiverCopy GET error:", err);
    return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
  }
}
