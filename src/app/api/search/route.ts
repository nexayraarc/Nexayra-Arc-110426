import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/api-auth";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(req: NextRequest) {
  const auth = await verifyAuth(req);
  if ("error" in auth) return auth.error;
  try {
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") || "").toLowerCase().trim();
    if (!q) return NextResponse.json({ ok: true, results: [] });

    const results: any[] = [];
    const match = (s: any) => String(s || "").toLowerCase().includes(q);

    // Parallel fetch from all collections
    const [lpoSnap, qtnSnap, rcSnap, taxSnap, projSnap, partnerSnap, expenseSnap, projExpSnap, invSnap] = await Promise.all([
      adminDb.collection("lpos").get(),
      adminDb.collection("quotations").get(),
      adminDb.collection("receiverCopies").get(),
      adminDb.collection("taxInvoices").get(),
      adminDb.collection("projects").get(),
      adminDb.collection("partners").get(),
      adminDb.collection("expenses").get(),
      adminDb.collection("projectExpenses").get(),
      adminDb.collection("invoices").get(),
    ]);

    lpoSnap.docs.forEach(d => {
      const x = d.data();
      if (match(x.nxrNo) || match(x.clientName) || match(x.vendorName) || match(x.project) || match(x.reference)) {
        results.push({ type: "LPO", title: `LPO #${x.nxrNo}`, subtitle: `${x.vendorName||""} · ${x.clientName||""}`, href: "/dashboard/procurement/lpo/history" });
      }
    });
    qtnSnap.docs.forEach(d => {
      const x = d.data();
      if (match(x.quotationNo) || match(x.to) || match(x.attn) || match(x.project) || match(x.serviceTitle)) {
        results.push({ type: "Quotation", title: x.quotationNo, subtitle: `${x.to||""} · ${x.project||""}`, href: "/dashboard/estimation/quotation/history" });
      }
    });
    rcSnap.docs.forEach(d => {
      const x = d.data();
      if (match(x.documentNo) || match(x.receivedFrom) || match(x.companyName)) {
        results.push({ type: "Receipt", title: x.documentNo, subtitle: `${x.receivedFrom||""} · AED ${x.amount||""}`, href: "/dashboard/accounts/receipts/history" });
      }
    });
    taxSnap.docs.forEach(d => {
      const x = d.data();
      if (match(x.invoiceNo) || match(x.clientName) || match(x.project)) {
        results.push({ type: "Tax Invoice", title: x.invoiceNo, subtitle: `${x.clientName||""}`, href: "/dashboard/accounts/tax-invoice/history" });
      }
    });
    projSnap.docs.forEach(d => {
      const x = d.data();
      if (match(x.code) || match(x.name) || match(x.client) || match(x.scope)) {
        results.push({ type: "Project", title: `${x.code} — ${x.name}`, subtitle: `${x.client||""}`, href: "/dashboard/accounts/projects" });
      }
    });
    partnerSnap.docs.forEach(d => {
      const x = d.data();
      if (match(x.name) || match(x.email)) {
        results.push({ type: "Partner", title: x.name, subtitle: x.email||"", href: "/dashboard/accounts/partners" });
      }
    });
    expenseSnap.docs.forEach(d => {
      const x = d.data();
      if (match(x.description) || match(x.vendor) || match(x.paidBy)) {
        results.push({ type: "Expense", title: x.description || "Expense", subtitle: `${x.vendor||""} · AED ${x.amount||""}`, href: "/dashboard/accounts/expenses" });
      }
    });
    projExpSnap.docs.forEach(d => {
      const x = d.data();
      if (match(x.description) || match(x.vendor) || match(x.paidBy)) {
        results.push({ type: "Project Expense", title: x.description || "Project Expense", subtitle: `${x.vendor||""} · AED ${x.amount||""}`, href: "/dashboard/accounts/project-expenses" });
      }
    });
    invSnap.docs.forEach(d => {
      const x = d.data();
      if (match(x.invoiceNo) || match(x.clientName)) {
        results.push({ type: "Invoice", title: x.invoiceNo, subtitle: `${x.clientName||""} · AED ${x.total||""}`, href: "/dashboard/accounts/invoicing" });
      }
    });

    return NextResponse.json({ ok: true, results: results.slice(0, 30) });
  } catch (err: any) {
    console.error("search error:", err);
    return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
  }
}