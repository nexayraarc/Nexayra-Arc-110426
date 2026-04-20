import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/api-auth";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(req: NextRequest) {
  const auth = await verifyAuth(req);
  if ("error" in auth) return auth.error;
  try {
    const url = new URL(req.url);
    const bankAccountId = url.searchParams.get("bankAccountId");
    const limit = Number(url.searchParams.get("limit") || 100);
    let q: any = adminDb.collection("bankTransactions").orderBy("date", "desc").limit(limit);
    if (bankAccountId) q = adminDb.collection("bankTransactions").where("bankAccountId", "==", bankAccountId).orderBy("date", "desc").limit(limit);
    const snap = await q.get();
    const transactions = snap.docs.map((d: any) => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        date: data.date?.toDate?.()?.toISOString() || data.date,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
      };
    });
    return NextResponse.json({ ok: true, transactions });
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
  }
}