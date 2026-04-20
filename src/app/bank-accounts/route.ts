import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, requireAccountsWrite } from "@/lib/api-auth";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function GET(req: NextRequest) {
  const auth = await verifyAuth(req);
  if ("error" in auth) return auth.error;
  try {
    const snap = await adminDb.collection("bankAccounts").orderBy("createdAt", "asc").get();
    const accounts = await Promise.all(snap.docs.map(async (d: any) => {
      const data = d.data();
      // Sum of transactions
      const txSnap = await adminDb.collection("bankTransactions").where("bankAccountId", "==", d.id).get();
      const txSum = txSnap.docs.reduce((s: number, t: any) => s + (t.data().amount || 0), 0);
      const currentBalance = (data.openingBalance || 0) + txSum;
      return {
        id: d.id,
        name: data.name,
        openingBalance: data.openingBalance || 0,
        currentBalance,
        isActive: data.isActive !== false,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
      };
    }));
    return NextResponse.json({ ok: true, accounts });
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await verifyAuth(req);
  if ("error" in auth) return auth.error;
  const forbidden = requireAccountsWrite(auth); if (forbidden) return forbidden;
  try {
    const body = await req.json();
    if (!body.name?.trim()) return NextResponse.json({ ok: false, message: "Name required" }, { status: 400 });
    const docRef = await adminDb.collection("bankAccounts").add({
      name: body.name.trim(),
      openingBalance: Number(body.openingBalance || 0),
      isActive: true,
      createdAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ ok: true, id: docRef.id });
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = await verifyAuth(req);
  if ("error" in auth) return auth.error;
  const forbidden = requireAccountsWrite(auth); if (forbidden) return forbidden;
  try {
    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ ok: false, message: "id required" }, { status: 400 });
    if (updates.openingBalance !== undefined) updates.openingBalance = Number(updates.openingBalance);
    await adminDb.collection("bankAccounts").doc(id).set({ ...updates, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
  }
}