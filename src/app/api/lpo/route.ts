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
    const nxrNo = await adminDb.runTransaction(async (t: FirebaseFirestore.Transaction) => {
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
  try {
    const authResult = await verifyAuth(req);
    if ("error" in authResult) return authResult.error;

    const { requireLpoApprover } = await import("@/lib/api-auth");
    const forbidden = requireLpoApprover(authResult); if (forbidden) return forbidden;

    const { nxrNo, approvedBy, _docId } = await req.json();
    if ((!nxrNo && !_docId) || !approvedBy) return NextResponse.json({ ok: false, message: "Missing nxrNo/_docId or approvedBy" }, { status: 400 });

    let docRef;
    if (_docId) {
      docRef = adminDb.collection("lpos").doc(_docId);
    } else {
      docRef = adminDb.collection("lpos").doc(`LPO-${nxrNo}`);
      const docSnap = await docRef.get();
      if (!docSnap.exists) {
        const query = await adminDb.collection("lpos").where("nxrNo", "==", nxrNo).limit(1).get();
        if (query.empty) return NextResponse.json({ ok: false, message: `LPO ${nxrNo} not found.` }, { status: 404 });
        docRef = query.docs[0].ref;
      }
    }

    await docRef.set({ approved: true, approvedBy, approvedAt: FieldValue.serverTimestamp() }, { merge: true });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("LPO PATCH error:", err);
    return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if ("error" in authResult) return authResult.error;
    const body = await req.json();
    const { nxrNo, _docId, ...updates } = body;
    if (!nxrNo && !_docId) return NextResponse.json({ ok: false, message: "Missing nxrNo or _docId" }, { status: 400 });

    let docId = _docId;
    if (!docId) {
      // Try canonical ID first
      docId = `LPO-${nxrNo}`;
      const canonical = await adminDb.collection("lpos").doc(docId).get();
      if (!canonical.exists) {
        const query = await adminDb.collection("lpos").where("nxrNo", "==", nxrNo).limit(1).get();
        if (query.empty) return NextResponse.json({ ok: false, message: `LPO ${nxrNo} not found.` }, { status: 404 });
        docId = query.docs[0].id;
      }
    }

    const { createRevision } = await import("@/lib/revisions");
    const newNumber = await createRevision("lpos", docId, "nxrNo", updates, authResult.email || "");
    return NextResponse.json({ ok: true, newNumber });
  } catch (err: any) {
    console.error("LPO PUT error:", err);
    return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
  }
}