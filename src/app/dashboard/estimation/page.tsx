"use client";

import { useEffect, useMemo, useState } from "react";
import { apiCall } from "@/lib/api-client";
import { fmtAED, fmtDate } from "@/lib/format";
import { ClipboardList, FileText, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import Link from "next/link";

type Quotation = { quotationNo: string; clientName?: string; to?: string; totalWithVat: number; createdAt: string };

export default function EstimationDashboard() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { const r = await apiCall<{quotations: Quotation[]}>("/api/quotation"); setQuotations(r.quotations || []); }
      finally { setLoading(false); }
    })();
  }, []);

  const kpis = useMemo(() => {
    const total = quotations.length;
    const totalValue = quotations.reduce((s,q)=>s+(q.totalWithVat||0),0);
    const thisMonth = quotations.filter(q => { const d = new Date(q.createdAt); const n = new Date(); return d.getFullYear()===n.getFullYear() && d.getMonth()===n.getMonth(); }).length;
    return { total, totalValue, thisMonth };
  }, [quotations]);

  const monthly = useMemo(() => {
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const year = new Date().getFullYear();
    return months.map((m,i) => {
      const yearQs = quotations.filter(q => { const d = new Date(q.createdAt); return d.getFullYear()===year && d.getMonth()===i; });
      return { month: m, count: yearQs.length, value: yearQs.reduce((s,q)=>s+(q.totalWithVat||0),0) };
    });
  }, [quotations]);

  if (loading) return <div className="w-6 h-6 border-[3px] border-navy border-t-transparent rounded-full animate-spin"/>;

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-gold to-amber-600 text-white rounded-2xl p-5 hover-lift">
          <div className="flex items-center gap-2 mb-2"><ClipboardList size={16}/><p className="text-white/80 text-xs uppercase font-bold">Total Quotations</p></div>
          <p className="text-2xl font-bold">{kpis.total}</p>
        </div>
        <div className="bg-white border border-navy-100 rounded-2xl p-5 hover-lift">
          <div className="flex items-center gap-2 mb-2"><FileText size={16} className="text-navy"/><p className="text-navy text-xs uppercase font-bold">This Month</p></div>
          <p className="text-2xl font-bold text-navy">{kpis.thisMonth}</p>
        </div>
        <div className="bg-white border border-navy-100 rounded-2xl p-5 hover-lift">
          <div className="flex items-center gap-2 mb-2"><TrendingUp size={16} className="text-green-600"/><p className="text-green-600 text-xs uppercase font-bold">Total Quoted Value</p></div>
          <p className="text-2xl font-bold text-navy">{fmtAED(kpis.totalValue)}</p>
        </div>
      </div>

      <div className="bg-white border border-navy-100 rounded-2xl p-6 shadow-sm">
        <h3 className="font-display text-lg font-bold text-navy mb-4">Quotation Value by Month ({new Date().getFullYear()})</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={monthly}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e8eaf5"/>
            <XAxis dataKey="month" style={{ fontSize: "11px" }}/>
            <YAxis style={{ fontSize: "11px" }}/>
            <Tooltip formatter={(v: number) => fmtAED(v)}/>
            <Bar dataKey="value" fill="#c9a84c" name="Value" radius={[4,4,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white border border-navy-100 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-bold text-navy">Recent Quotations</h3>
          <Link href="/dashboard/estimation/quotation/history" className="text-sm text-navy font-semibold hover:underline">View all →</Link>
        </div>
        {quotations.slice(0,5).length === 0 ? <p className="text-navy-300 text-center py-8">No quotations yet.</p> : (
          <div className="space-y-2">
            {quotations.slice(0,5).map(q => (
              <div key={q.quotationNo} className="flex items-center justify-between p-3 bg-navy-50/30 rounded-lg">
                <div>
                  <p className="font-semibold text-navy">{q.quotationNo}</p>
                  <p className="text-xs text-navy-400">{fmtDate(q.createdAt)} · {q.to || q.clientName || "-"}</p>
                </div>
                <span className="font-bold text-navy">{fmtAED(q.totalWithVat)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}