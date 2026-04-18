"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { apiCall } from "@/lib/api-client";
import Link from "next/link";
import { FileText, FileCheck, Receipt, ArrowRight, TrendingUp } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

type Counts = { lpos: number; quotations: number; receiverCopies: number };
const COLORS = ["#1c2143", "#c9a84c", "#0f766e"];

export default function DashboardPage() {
  const [counts, setCounts] = useState<Counts>({ lpos: 0, quotations: 0, receiverCopies: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCounts() {
      try {
        const [lpoRes, qtnRes, rcRes] = await Promise.all([
          apiCall<any>("/api/lpo"), apiCall<any>("/api/quotation"), apiCall<any>("/api/receiver-copy"),
        ]);
        setCounts({ lpos: lpoRes.lpos?.length || 0, quotations: qtnRes.quotations?.length || 0, receiverCopies: rcRes.receiverCopies?.length || 0 });
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    fetchCounts();
  }, []);

  const pieData = [
    { name: "LPOs", value: counts.lpos },
    { name: "Quotations", value: counts.quotations },
    { name: "Receiver Copies", value: counts.receiverCopies },
  ];
  const total = counts.lpos + counts.quotations + counts.receiverCopies;
  const userName = auth.currentUser?.email?.split("@")[0] || "there";

  const modules = [
    { href: "/dashboard/lpo", label: "Create LPO", desc: "Local Purchase Order", icon: FileText, count: counts.lpos, gradient: "from-navy to-navy-700" },
    { href: "/dashboard/quotation", label: "Create Quotation", desc: "Commercial Proposal", icon: FileCheck, count: counts.quotations, gradient: "from-gold to-gold-500" },
    { href: "/dashboard/receiver-copy", label: "Receiver Copy", desc: "Cheque Receipt", icon: Receipt, count: counts.receiverCopies, gradient: "from-teal-600 to-teal-700" },
  ];

  return (
    <div>
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-navy to-navy-700 rounded-2xl p-8 mb-8 text-white relative overflow-hidden animate-fade-in-up">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 animate-float" />
        <div className="absolute bottom-0 left-1/2 w-48 h-48 bg-gold/10 rounded-full translate-y-1/2" />
        <div className="absolute top-6 right-8 opacity-10">
          <TrendingUp size={120} strokeWidth={1} />
        </div>
        <div className="relative z-10">
          <h1 className="font-display text-3xl font-bold mb-2">Welcome back, {userName}!</h1>
          <p className="text-navy-200 max-w-lg">
            Nexayra Arc General Contracting L.L.C. — Generate and manage your LPOs, Quotations, and Receiver Copies from one place.
          </p>
          <p className="text-navy-300 text-sm mt-3">{total} document{total !== 1 ? "s" : ""} created to date</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Pie chart */}
        <div className="bg-white rounded-2xl border border-navy-100 p-6 shadow-sm hover-lift animate-fade-in-up delay-1">
          <h2 className="font-display text-lg font-bold text-navy mb-1">Documents Overview</h2>
          <p className="text-navy-400 text-sm mb-4">Distribution by type</p>
          {loading ? (
            <div className="h-64 flex items-center justify-center"><div className="w-6 h-6 border-[3px] border-navy border-t-transparent rounded-full animate-spin" /></div>
          ) : total === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-navy-300 text-sm gap-2">
              <div className="w-16 h-16 rounded-full bg-navy-50 flex items-center justify-center mb-2"><FileText size={24} className="text-navy-300" /></div>
              No documents yet. Create your first one!
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={65} outerRadius={105} paddingAngle={4} dataKey="value" stroke="none" animationBegin={200} animationDuration={800}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e8eaf5", borderRadius: "12px", fontSize: "13px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }} />
                <Legend wrapperStyle={{ fontSize: "13px", color: "#1c2143" }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Module cards */}
        <div className="grid gap-4">
          {modules.map((mod, i) => (
            <Link key={mod.href} href={mod.href}
              className={`animate-fade-in-up delay-${i + 2} group flex items-center gap-5 p-5 rounded-2xl bg-white border border-navy-100 shadow-sm hover-lift`}>
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${mod.gradient} flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <mod.icon size={24} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-navy font-bold text-lg">{mod.label}</h3>
                <p className="text-navy-400 text-sm">{mod.desc}</p>
              </div>
              <div className="text-right">
                <span className="text-3xl font-bold text-navy">{loading ? "…" : mod.count}</span>
                <p className="text-navy-400 text-xs">created</p>
              </div>
              <ArrowRight size={20} className="text-navy-300 group-hover:text-navy group-hover:translate-x-1 transition-all duration-300" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
