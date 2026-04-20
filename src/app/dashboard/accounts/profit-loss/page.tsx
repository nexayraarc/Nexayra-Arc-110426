"use client";

import { useEffect, useMemo, useState } from "react";
import { apiCall } from "@/lib/api-client";
import { fmtAED } from "@/lib/format";

type Expense = { id: string; date: string; amount: number };
type PE = { id: string; date: string; amount: number; projectId: string };
type Col = { id: string; date: string; amount: number; invoiceId: string };

export default function ProfitLossPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [projectExp, setProjectExp] = useState<PE[]>([]);
  const [collections, setCollections] = useState<Col[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"quarter" | "year">("quarter");
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    (async () => {
      try {
        const [e, pe, c] = await Promise.all([
          apiCall<{expenses: Expense[]}>("/api/expenses"),
          apiCall<{expenses: PE[]}>("/api/project-expenses"),
          apiCall<{collections: Col[]}>("/api/collections"),
        ]);
        setExpenses(e.expenses); setProjectExp(pe.expenses); setCollections(c.collections);
      } finally { setLoading(false); }
    })();
  }, []);

  const periods = useMemo(() => {
    const inYear = (iso: string) => new Date(iso).getFullYear() === year;
    const qOf = (iso: string) => Math.floor(new Date(iso).getMonth() / 3) + 1;
    const buckets: { label: string; revenue: number; expenses: number; profit: number }[] = [];

    if (period === "year") {
      const revenue = collections.filter(c => inYear(c.date)).reduce((s,c)=>s+c.amount,0);
      const exp = [...expenses, ...projectExp].filter(e => inYear(e.date)).reduce((s,e)=>s+e.amount,0);
      buckets.push({ label: String(year), revenue, expenses: exp, profit: revenue - exp });
    } else {
      for (let q = 1; q <= 4; q++) {
        const revenue = collections.filter(c => inYear(c.date) && qOf(c.date) === q).reduce((s,c)=>s+c.amount,0);
        const exp = [...expenses, ...projectExp].filter(e => inYear(e.date) && qOf(e.date) === q).reduce((s,e)=>s+e.amount,0);
        buckets.push({ label: `Q${q} ${year}`, revenue, expenses: exp, profit: revenue - exp });
      }
    }
    return buckets;
  }, [expenses, projectExp, collections, period, year]);

  if (loading) return <div className="w-6 h-6 border-[3px] border-navy border-t-transparent rounded-full animate-spin"/>;

  const inp = "px-3 py-2 bg-white border border-navy-200 rounded-lg text-navy text-sm";
  const years = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-navy-100 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold text-navy">Profit & Loss Statement</h2>
          <div className="flex gap-2">
            <select value={period} onChange={e=>setPeriod(e.target.value as any)} className={inp}>
              <option value="quarter">Quarterly</option><option value="year">Yearly</option>
            </select>
            <select value={year} onChange={e=>setYear(Number(e.target.value))} className={inp}>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        <table className="w-full text-sm">
          <thead><tr className="text-navy-400 text-xs uppercase font-bold tracking-wider border-b border-navy-100">
            <th className="text-left py-2">Period</th>
            <th className="text-right">Revenue</th>
            <th className="text-right">Expenses</th>
            <th className="text-right">Profit / Loss</th>
          </tr></thead>
          <tbody>
            {periods.map(p => (
              <tr key={p.label} className="border-b border-navy-50">
                <td className="py-3 font-semibold text-navy">{p.label}</td>
                <td className="text-right text-green-600 font-semibold">{fmtAED(p.revenue)}</td>
                <td className="text-right text-red-500 font-semibold">{fmtAED(p.expenses)}</td>
                <td className={`text-right font-bold ${p.profit >= 0 ? "text-green-600" : "text-red-500"}`}>{fmtAED(p.profit)}</td>
              </tr>
            ))}
            <tr className="bg-navy-50">
              <td className="py-3 font-bold text-navy">Total</td>
              <td className="text-right font-bold text-green-600">{fmtAED(periods.reduce((s,p)=>s+p.revenue,0))}</td>
              <td className="text-right font-bold text-red-500">{fmtAED(periods.reduce((s,p)=>s+p.expenses,0))}</td>
              <td className="text-right font-bold text-navy">{fmtAED(periods.reduce((s,p)=>s+p.profit,0))}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}