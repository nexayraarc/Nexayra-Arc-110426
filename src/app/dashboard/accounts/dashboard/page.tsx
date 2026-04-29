"use client";

import { useEffect, useMemo, useState } from "react";
import { apiCall } from "@/lib/api-client";
import { fmtAED } from "@/lib/format";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from "recharts";

type Bank = { id: string; currentBalance: number };
type Expense = { id: string; date: string; amount: number; categoryId: string };
type Col = { id: string; date: string; amount: number };

const COLORS = ["#1c2143", "#c9a84c", "#0f766e", "#4150aa", "#b91c1c", "#6b56b8"];

export default function AccountsDashboard() {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [projectExp, setProjectExp] = useState<Expense[]>([]);
  const [collections, setCollections] = useState<Col[]>([]);
  const [cats, setCats] = useState<{id:string;name:string}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [b, e, pe, c, cc] = await Promise.all([
          apiCall<any>("/api/bank-accounts"),
          apiCall<any>("/api/expenses"),
          apiCall<any>("/api/project-expenses"),
          apiCall<any>("/api/collections"),
          apiCall<any>("/api/expense-categories"),
        ]);
        setBanks(b.accounts); setExpenses(e.expenses); setProjectExp(pe.expenses); setCollections(c.collections); setCats(cc.categories);
      } finally { setLoading(false); }
    })();
  }, []);

  const kpis = useMemo(() => {
    const totalCash = banks.reduce((s,b)=>s+b.currentBalance,0);
    const ytdRevenue = collections.filter(c => new Date(c.date).getFullYear() === new Date().getFullYear()).reduce((s,c)=>s+c.amount,0);
    const allExp = [...expenses, ...projectExp];
    const ytdExp = allExp.filter(e => new Date(e.date).getFullYear() === new Date().getFullYear()).reduce((s,e)=>s+e.amount,0);
    return { totalCash, ytdRevenue, ytdExp, ytdProfit: ytdRevenue - ytdExp };
  }, [banks, collections, expenses, projectExp]);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    [...expenses, ...projectExp].forEach(e => {
      const catName = cats.find(c=>c.id===e.categoryId)?.name || "Uncategorized";
      map.set(catName, (map.get(catName) || 0) + e.amount);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [expenses, projectExp, cats]);

  const monthlyFlow = useMemo(() => {
    const year = new Date().getFullYear();
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return months.map((m, i) => {
      const rev = collections.filter(c => { const d = new Date(c.date); return d.getFullYear() === year && d.getMonth() === i; }).reduce((s,c)=>s+c.amount,0);
      const exp = [...expenses, ...projectExp].filter(e => { const d = new Date(e.date); return d.getFullYear() === year && d.getMonth() === i; }).reduce((s,e)=>s+e.amount,0);
      return { month: m, revenue: rev, expenses: exp };
    });
  }, [collections, expenses, projectExp]);

  if (loading) return <div className="w-6 h-6 border-[3px] border-navy border-t-transparent rounded-full animate-spin"/>;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-navy to-navy-700 text-white rounded-2xl p-5"><p className="text-navy dark:text-white-200 text-xs uppercase font-bold tracking-wider">Cash in Hand</p><p className="text-2xl font-bold mt-1">{fmtAED(kpis.totalCash)}</p></div>
        <div className="bg-white border border-navy-100 rounded-2xl p-5 hover-lift"><p className="text-green-600 text-xs uppercase font-bold tracking-wider">YTD Revenue</p><p className="text-2xl font-bold text-navy dark:text-white mt-1">{fmtAED(kpis.ytdRevenue)}</p></div>
        <div className="bg-white border border-navy-100 rounded-2xl p-5 hover-lift"><p className="text-red-500 text-xs uppercase font-bold tracking-wider">YTD Expenses</p><p className="text-2xl font-bold text-navy dark:text-white mt-1">{fmtAED(kpis.ytdExp)}</p></div>
        <div className="bg-white border border-navy-100 rounded-2xl p-5 hover-lift"><p className="text-gold text-xs uppercase font-bold tracking-wider">YTD Profit</p><p className={`text-2xl font-bold mt-1 ${kpis.ytdProfit >= 0 ? "text-green-600" : "text-red-500"}`}>{fmtAED(kpis.ytdProfit)}</p></div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white border border-navy-100 rounded-2xl p-6 shadow-sm">
          <h3 className="font-latoxt-lg font-bold text-navy dark:text-white mb-4">Expenses by Category</h3>
          {byCategory.length === 0 ? <p className="text-navy dark:text-white-300 text-center py-12">No data</p> : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={byCategory} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value" stroke="none">
                  {byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
                </Pie>
                <Tooltip formatter={(v: number) => fmtAED(v)}/>
                <Legend wrapperStyle={{ fontSize: "12px" }}/>
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white border border-navy-100 rounded-2xl p-6 shadow-sm">
          <h3 className="font-latoxt-lg font-bold text-navy dark:text-white mb-4">Monthly Revenue vs Expenses ({new Date().getFullYear()})</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyFlow}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8eaf5"/>
              <XAxis dataKey="month" style={{ fontSize: "11px" }}/>
              <YAxis style={{ fontSize: "11px" }}/>
              <Tooltip formatter={(v: number) => fmtAED(v)}/>
              <Legend wrapperStyle={{ fontSize: "12px" }}/>
              <Bar dataKey="revenue" fill="#0f766e" name="Revenue"/>
              <Bar dataKey="expenses" fill="#b91c1c" name="Expenses"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white border border-navy-100 rounded-2xl p-6 shadow-sm">
        <h3 className="font-latoxt-lg font-bold text-navy dark:text-white mb-4">Profit Trend</h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={monthlyFlow.map(m => ({ ...m, profit: m.revenue - m.expenses }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e8eaf5"/>
            <XAxis dataKey="month" style={{ fontSize: "11px" }}/>
            <YAxis style={{ fontSize: "11px" }}/>
            <Tooltip formatter={(v: number) => fmtAED(v)}/>
            <Line type="monotone" dataKey="profit" stroke="#c9a84c" strokeWidth={3} dot={{ fill: "#c9a84c", r: 4 }}/>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}