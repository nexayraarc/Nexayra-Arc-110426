import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, requireAccountsWrite } from "@/lib/api-auth";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function GET(req: NextRequest) {
  const auth = await verifyAuth(req);
  if ("error" in auth) return auth.error;
  try {
    const snap = await adminDb.collection("projects").orderBy("createdAt", "desc").get();
    const projects = await Promise.all(snap.docs.map(async (d: any) => {
      const data = d.data();
      const peSnap = await adminDb.collection("projectExpenses").where("projectId", "==", d.id).get();
      const totalExpenses = peSnap.docs.reduce((s: number, e: any) => s + (e.data().amount || 0), 0);
      const invSnap = await adminDb.collection("invoices").where("projectId", "==", d.id).get();
      const totalInvoiced = invSnap.docs.reduce((s: number, i: any) => s + (i.data().total || 0), 0);
      const totalCollected = invSnap.docs.reduce((s: number, i: any) => s + (i.data().amountPaid || 0), 0);
      return {
        id: d.id, ...data,
        totalExpenses, totalInvoiced, totalCollected,
        profit: totalInvoiced - totalExpenses,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
      };
    }));
    return NextResponse.json({ ok: true, projects });
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
    const docRef = await adminDb.collection("projects").add({
      code: body.code?.trim() || "",
      name: body.name.trim(),
      client: body.client?.trim() || "",
      scope: body.scope?.trim() || "",
      contractValue: Number(body.contractValue || 0),
      startDate: body.startDate || "",
      endDate: body.endDate || "",
      status: body.status || "active",
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
    if (updates.contractValue !== undefined) updates.contractValue = Number(updates.contractValue);
    await adminDb.collection("projects").doc(id).set({ ...updates, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
  }
}