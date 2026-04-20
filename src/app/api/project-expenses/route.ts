import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, requireAccountsWrite } from "@/lib/api-auth";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { writeLedgerEntry, reverseLedgerBySource } from "@/lib/ledger";

export async function GET(req: NextRequest) {
  const auth = await verifyAuth(req);
  if ("error" in auth) return auth.error;
  try {
    const url = new URL(req.url);
    const projectId = url.searchParams.get("projectId");
    const snap = await adminDb.collection("projectExpenses").get();
    let expenses = snap.docs.map((d) => {
      const data = d.data();
      return { id: d.id, ...data, date: data.date?.toDate?.()?.toISOString() || data.date };
    });
    if (projectId) expenses = expenses.filter((e: any) => e.projectId === projectId);
    expenses.sort((a: any, b: any) => String(b.date).localeCompare(String(a.date)));
    return NextResponse.json({ ok: true, expenses });
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
    const { projectId, date, categoryId, description, amount, bankAccountId, vendor } = body;
    if (!projectId || !date || !amount || !bankAccountId)
      return NextResponse.json({ ok: false, message: "projectId, date, amount, bankAccountId required" }, { status: 400 });
    const amt = Number(amount);
    const docRef = await adminDb.collection("projectExpenses").add({
      projectId,
      date: Timestamp.fromDate(new Date(date)),
      categoryId: categoryId || "",
      description: description || "",
      amount: amt, bankAccountId,
      vendor: vendor || "",
      createdBy: auth.email || "",
      createdAt: FieldValue.serverTimestamp(),
    });
    await writeLedgerEntry({
      bankAccountId, amount: -amt, date, type: "project-expense",
      source: "projectExpenses", sourceId: docRef.id,
      description: `Project expense: ${description || ""}`,
      createdBy: auth.email,
    });
    return NextResponse.json({ ok: true, id: docRef.id });
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await verifyAuth(req);
  if ("error" in auth) return auth.error;
  const forbidden = requireAccountsWrite(auth); if (forbidden) return forbidden;
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ ok: false, message: "id required" }, { status: 400 });
    await reverseLedgerBySource("projectExpenses", id);
    await adminDb.collection("projectExpenses").doc(id).delete();
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
  }
}