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
    const counterRef = adminDb.collection("counters").doc("lpo");
    const nxrNo = await adminDb.runTransaction(async (t) => {
      const snap = await t.get(counterRef);
      const current = snap.exists ? (snap.data()?.current || 1000) : 1000;
      const next = current + 1;
      t.set(counterRef, { current: next }, { merge: true });
      return next;
    });
    const lpoData = { ...body, nxrNo, approved: false, approvedBy: "", approvedAt: null, createdBy: authResult.email || "", createdAt: FieldValue.serverTimestamp() };
    await adminDb.collection("lpos").doc(`LPO-${nxrNo}`).set(lpoData);
    return NextResponse.json({ ok: true, lpo: { ...lpoData, createdAt: new Date().toISOString() } });
  } catch (err: any) {
    console.error("LPO POST error:", err);
    return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const fbCheck = checkFirebaseInit();
  if (fbCheck) return fbCheck;
  try {
    const authResult = await verifyAuth(req);
    if ("error" in authResult) return authResult.error;
    const snap = await adminDb.collection("lpos").orderBy("nxrNo", "desc").get();
    const lpos = snap.docs.map((d) => {
      const data = d.data();
      return { ...data, _docId: d.id, createdAt: data.createdAt?.toDate?.()?.toISOString() || null, approvedAt: data.approvedAt?.toDate?.()?.toISOString() || null };
    });
    return NextResponse.json({ ok: true, lpos });
  } catch (err: any) {
    console.error("LPO GET error:", err);
    return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const fbCheck = checkFirebaseInit();
  if (fbCheck) return fbCheck;
  try {
    const authResult = await verifyAuth(req);
    if ("error" in authResult) return authResult.error;
    const { nxrNo, approvedBy } = await req.json();
    if (!nxrNo || !approvedBy) return NextResponse.json({ ok: false, message: "Missing nxrNo or approvedBy" }, { status: 400 });

    const docRef = adminDb.collection("lpos").doc(`LPO-${nxrNo}`);
    const docSnap = await docRef.get();
    if (docSnap.exists) {
      await docRef.set({ approved: true, approvedBy, approvedAt: FieldValue.serverTimestamp() }, { merge: true });
    } else {
      const query = await adminDb.collection("lpos").where("nxrNo", "==", Number(nxrNo)).limit(1).get();
      if (query.empty) return NextResponse.json({ ok: false, message: `LPO #${nxrNo} not found.` }, { status: 404 });
      await query.docs[0].ref.set({ approved: true, approvedBy, approvedAt: FieldValue.serverTimestamp() }, { merge: true });
    }
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("LPO PATCH error:", err);
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
    const { nxrNo, updatedNxrNo, ...updates } = body;
    if (!nxrNo) return NextResponse.json({ ok: false, message: "Missing nxrNo" }, { status: 400 });

    const docRef = adminDb.collection("lpos").doc(`LPO-${nxrNo}`);
    const docSnap = await docRef.get();
    const updateData = updatedNxrNo ? { ...updates, nxrNo: updatedNxrNo, updatedAt: FieldValue.serverTimestamp() } : { ...updates, updatedAt: FieldValue.serverTimestamp() };
    if (docSnap.exists) {
      await docRef.set(updateData, { merge: true });
    } else {
      const query = await adminDb.collection("lpos").where("nxrNo", "==", Number(nxrNo)).limit(1).get();
      if (query.empty) return NextResponse.json({ ok: false, message: `LPO #${nxrNo} not found.` }, { status: 404 });
      await query.docs[0].ref.set(updateData, { merge: true });
    }
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("LPO PUT error:", err);
    return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
  }
}
