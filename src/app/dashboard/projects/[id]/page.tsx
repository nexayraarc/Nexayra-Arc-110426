"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiCall } from "@/lib/api-client";
import { fmtAED } from "@/lib/format";
import {
  ArrowLeft, MapPin, Calendar, User, Building2, Briefcase,
  DollarSign, TrendingUp, AlertTriangle, CheckCircle2, FileText, Receipt,
} from "lucide-react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area, RadialBarChart, RadialBar,
} from "recharts";
import { useChartTheme } from "@/lib/chart-theme";
// inside component:
const t = useChartTheme();

type Project = {
  id: string;
  code: string;
  name: string;
  client: string;
  location?: string;
  status?: string;
  contractValue: number;
  budgetedCost?: number;
  plannedStart?: string;
  plannedEnd?: string;
  actualProgress?: number;
  projectManager?: string;
  scope?: string;
};
type PE = { id: string; date: string; amount: number; projectId: string; expenseType?: string; description?: string };
type LPO = { id: string; nxrNo: number; vendorName: string; date: string; total: number; projectId?: string; approved?: boolean };
type Inv = { id: string; documentNo: string; date: string; amount: number; projectId: string };
type Col = { id: string; date: string; amount: number; projectId: string; invoiceId?: string };

const TYPE_COLORS: Record<string, string> = {
  material: "#1c2143",
  manpower: "#c9a84c",
  equipment: "#0f766e",
  subcontractor: "#4150aa",
  misc: "#6b56b8",
};

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [expenses, setExpenses] = useState<PE[]>([]);
  const [lpos, setLpos] = useState<LPO[]>([]);
  const [invoices, setInvoices] = useState<Inv[]>([]);
  const [collections, setCollections] = useState<Col[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [pAll, peAll, lpoAll, invAll, colAll] = await Promise.all([
          apiCall<{ projects: Project[] }>("/api/accounts-projects"),
          apiCall<{ expenses: PE[] }>("/api/project-expenses"),
          apiCall<{ lpos: LPO[] }>("/api/lpo").catch(() => ({ lpos: [] as LPO[] })),
          apiCall<{ invoices: Inv[] }>("/api/tax-invoice").catch(() => ({ invoices: [] as Inv[] })),
          apiCall<{ collections: Col[] }>("/api/collections").catch(() => ({ collections: [] as Col[] })),
        ]);
        const p = pAll.projects.find(x => x.id === projectId) || null;
        setProject(p);
        setExpenses((peAll.expenses || []).filter(e => e.projectId === projectId));
        setLpos((lpoAll.lpos || []).filter(l => l.projectId === projectId));
        setInvoices((invAll.invoices || []).filter(i => i.projectId === projectId));
        setCollections((colAll.collections || []).filter(c => c.projectId === projectId));
      } finally {
        setLoading(false);
      }
    })();
  }, [projectId]);

  const stats = useMemo(() => {
    const spent = expenses.reduce((s, e) => s + e.amount, 0);
    const billed = invoices.reduce((s, i) => s + i.amount, 0);
    const received = collections.reduce((s, c) => s + c.amount, 0);
    const outstanding = billed - received;
    const lpoTotal = lpos.reduce((s, l) => s + (l.total || 0), 0);
    const lpoApproved = lpos.filter(l => l.approved).length;
    const budgetUsage = project?.budgetedCost ? (spent / project.budgetedCost) * 100 : 0;
    const overBudget = project?.budgetedCost ? spent > project.budgetedCost : false;
    let daysLeft = 0;
    let totalDuration = 0;
    let elapsedDays = 0;
    if (project?.plannedEnd) {
      const end = new Date(project.plannedEnd).getTime();
      const today = Date.now();
      daysLeft = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
    }
    if (project?.plannedStart && project?.plannedEnd) {
      const start = new Date(project.plannedStart).getTime();
      const end = new Date(project.plannedEnd).getTime();
      totalDuration = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      elapsedDays = Math.max(0, Math.ceil((Date.now() - start) / (1000 * 60 * 60 * 24)));
    }
    const timeProgress = totalDuration > 0 ? Math.min(100, (elapsedDays / totalDuration) * 100) : 0;
    return { spent, billed, received, outstanding, lpoTotal, lpoApproved, budgetUsage, overBudget, daysLeft, timeProgress };
  }, [expenses, invoices, collections, lpos, project]);

  const costByType = useMemo(() => {
    const map = new Map<string, number>();
    expenses.forEach(e => {
      const t = e.expenseType || "misc";
      map.set(t, (map.get(t) || 0) + e.amount);
    });
    return Array.from(map, ([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      key: name,
    }));
  }, [expenses]);

  const monthlyExpenses = useMemo(() => {
    const map = new Map<string, number>();
    const fmt = (iso: string) => {
      const d = new Date(iso);
      return `${d.toLocaleString("en-US", { month: "short" })} ${String(d.getFullYear()).slice(2)}`;
    };
    expenses.forEach(e => {
      const k = fmt(e.date);
      map.set(k, (map.get(k) || 0) + e.amount);
    });
    return Array.from(map, ([month, amount]) => ({ month, amount }))
      .sort((a, b) => new Date("01-" + a.month).getTime() - new Date("01-" + b.month).getTime())
      .slice(-12);
  }, [expenses]);

  const billedVsReceived = useMemo(() => {
    const map = new Map<string, { billed: number; received: number }>();
    const fmt = (iso: string) => {
      const d = new Date(iso);
      return `${d.toLocaleString("en-US", { month: "short" })} ${String(d.getFullYear()).slice(2)}`;
    };
    invoices.forEach(i => {
      const k = fmt(i.date);
      const prev = map.get(k) || { billed: 0, received: 0 };
      map.set(k, { ...prev, billed: prev.billed + i.amount });
    });
    collections.forEach(c => {
      const k = fmt(c.date);
      const prev = map.get(k) || { billed: 0, received: 0 };
      map.set(k, { ...prev, received: prev.received + c.amount });
    });
    return Array.from(map, ([month, v]) => ({ month, ...v }))
      .sort((a, b) => new Date("01-" + a.month).getTime() - new Date("01-" + b.month).getTime())
      .slice(-12);
  }, [invoices, collections]);

  const progressData = [
    { name: "Progress", value: project?.actualProgress || 0, fill: "#c9a84c" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-[3px] border-navy border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-16">
        <p className="text-navy-400 mb-4">Project not found.</p>
        <Link href="/dashboard/projects" className="text-gold font-semibold hover:underline">← Back to Projects</Link>
      </div>
    );
  }

  return (
    <div>
      {/* Back button */}
      <button
        onClick={() => router.push("/dashboard/projects")}
        className="flex items-center gap-2 text-navy-400 hover:text-navy text-sm font-semibold mb-4 transition-all">
        <ArrowLeft size={16} /> Back to Projects
      </button>

      {/* Header card */}
      <div className="bg-gradient-to-r from-navy to-navy-700 rounded-2xl p-6 mb-6 text-white relative overflow-hidden animate-fade-in-up">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-1/2 w-48 h-48 bg-gold/10 rounded-full translate-y-1/2" />
        <div className="relative z-10">
          <p className="text-gold font-semibold text-sm mb-1">{project.code}</p>
          <h1 className="font-display text-3xl font-bold mb-2">{project.name}</h1>
          <div className="flex flex-wrap items-center gap-4 text-navy-200 text-sm">
            <span className="flex items-center gap-1.5"><Building2 size={14} /> {project.client}</span>
            {project.location && <span className="flex items-center gap-1.5"><MapPin size={14} /> {project.location}</span>}
            {project.projectManager && <span className="flex items-center gap-1.5"><User size={14} /> {project.projectManager}</span>}
            {project.plannedStart && project.plannedEnd && (
              <span className="flex items-center gap-1.5">
                <Calendar size={14} /> {new Date(project.plannedStart).toLocaleDateString()} → {new Date(project.plannedEnd).toLocaleDateString()}
              </span>
            )}
            <span className="px-2.5 py-1 bg-white/10 rounded-lg text-xs font-bold uppercase">{project.status || "Planning"}</span>
          </div>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Contract", value: fmtAED(project.contractValue || 0), icon: DollarSign, color: "from-navy to-navy-700", text: "text-white" },
          { label: "Budget", value: fmtAED(project.budgetedCost || 0), icon: Briefcase, color: "from-indigo-600 to-indigo-700", text: "text-white" },
          { label: "Spent", value: fmtAED(stats.spent), icon: TrendingUp, color: stats.overBudget ? "from-rose-600 to-rose-700" : "from-gold to-gold-500", text: stats.overBudget ? "text-white" : "text-navy" },
          { label: "Billed", value: fmtAED(stats.billed), icon: FileText, color: "from-teal-600 to-teal-700", text: "text-white" },
          { label: "Received", value: fmtAED(stats.received), icon: CheckCircle2, color: "from-emerald-600 to-emerald-700", text: "text-white" },
          { label: "Outstanding", value: fmtAED(stats.outstanding), icon: AlertTriangle, color: "from-amber-600 to-amber-700", text: "text-white" },
          { label: "LPOs", value: `${lpos.length} (${stats.lpoApproved} appr.)`, icon: Receipt, color: "from-purple-600 to-purple-700", text: "text-white" },
          { label: "Days Left", value: stats.daysLeft >= 0 ? `${stats.daysLeft}` : `${Math.abs(stats.daysLeft)} late`, icon: Calendar, color: stats.daysLeft < 0 ? "from-rose-600 to-rose-700" : "from-slate-600 to-slate-700", text: "text-white" },
        ].map((k, i) => (
          <div key={k.label}
            className={`bg-gradient-to-br ${k.color} ${k.text} rounded-2xl p-4 shadow-sm animate-fade-in-up`}
            style={{ animationDelay: `${i * 0.04}s` }}>
            <k.icon size={16} className="opacity-80 mb-2" />
            <p className="text-[10px] font-bold uppercase opacity-80">{k.label}</p>
            <p className="text-base font-bold mt-1 truncate">{k.value}</p>
          </div>
        ))}
      </div>

      {/* Progress bars */}
      <div className="grid lg:grid-cols-2 gap-5 mb-5">
        <div className="bg-white dark:bg-navy-800 border border-navy-100 dark:border-navy-700 rounded-2xl p-5 shadow-sm animate-fade-in-up delay-1">
          <h3 className="font-display text-base font-bold text-navy dark:text-white mb-4">Budget Utilization</h3>
          <div className="flex items-end justify-between mb-2">
            <span className="text-3xl font-bold text-navy dark:text-white">{stats.budgetUsage.toFixed(1)}%</span>
            <span className="text-sm text-navy-400">{fmtAED(stats.spent)} / {fmtAED(project.budgetedCost || 0)}</span>
          </div>
          <div className="h-3 bg-navy-50 dark:bg-navy-700 rounded-full overflow-hidden mb-2">
            <div
              className={`h-full rounded-full transition-all ${stats.overBudget ? "bg-red-500" : stats.budgetUsage > 80 ? "bg-amber-500" : "bg-gold"}`}
              style={{ width: `${Math.min(100, stats.budgetUsage)}%` }}
            />
          </div>
          {stats.overBudget && (
            <p className="text-xs text-red-600 font-semibold flex items-center gap-1">
              <AlertTriangle size={12} /> Over budget by {fmtAED(stats.spent - (project.budgetedCost || 0))}
            </p>
          )}
        </div>

        <div className="bg-white dark:bg-navy-800 border border-navy-100 dark:border-navy-700 rounded-2xl p-5 shadow-sm animate-fade-in-up delay-2">
          <h3 className="font-display text-base font-bold text-navy dark:text-white mb-4">Project Progress</h3>
          <div className="flex items-end justify-between mb-2">
            <span className="text-3xl font-bold text-navy dark:text-white">{(project.actualProgress || 0).toFixed(0)}%</span>
            <span className="text-sm text-navy-400">Time elapsed: {stats.timeProgress.toFixed(0)}%</span>
          </div>
          <div className="h-3 bg-navy-50 dark:bg-navy-700 rounded-full overflow-hidden mb-1 relative">
            <div className="h-full bg-gold rounded-full transition-all" style={{ width: `${project.actualProgress || 0}%` }} />
            <div className="absolute top-0 h-full w-0.5 bg-navy" style={{ left: `${stats.timeProgress}%` }} />
          </div>
          <div className="flex items-center justify-between text-[10px] text-navy-400 font-semibold mt-1">
            <span>0%</span>
            <span>Gold = actual · Navy line = expected</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      {/* Charts row 1 */}
      <div className="grid lg:grid-cols-2 gap-5 mb-5">
        <div className="bg-white dark:bg-navy-800 border border-navy-100 dark:border-navy-700 rounded-2xl p-5 shadow-sm animate-fade-in-up delay-3">
          <h3 className="font-display text-base font-bold text-navy dark:text-white mb-1">Cost Breakdown</h3>
          <p className="text-navy-400 text-xs mb-3">Spend by category</p>
          {costByType.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-navy-300 text-sm">No expenses recorded.</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={costByType} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} dataKey="value" stroke="none">
                  {costByType.map(entry => (
                    <Cell key={entry.key} fill={TYPE_COLORS[entry.key] || "#888"} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "#1c2143", border: "none", borderRadius: 10, color: "#fff", fontSize: 12 }}
                  formatter={(v: number) => fmtAED(v)}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white dark:bg-navy-800 border border-navy-100 dark:border-navy-700 rounded-2xl p-5 shadow-sm animate-fade-in-up delay-4">
          <h3 className="font-display text-base font-bold text-navy dark:text-white mb-1">Monthly Expenses</h3>
          <p className="text-navy-400 text-xs mb-3">Last 12 months of project spend</p>
          {monthlyExpenses.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-navy-300 text-sm">No expenses yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlyExpenses}>
                <CartesianGrid strokeDasharray="3 3" stroke={t.grid} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: t.axisText }} />
                <YAxis tick={{ fontSize: 11, fill: t.axisText }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: "#1c2143", border: "none", borderRadius: 10, color: "#fff", fontSize: 12 }}
                  formatter={(v: number) => fmtAED(v)}
                />
                <Bar dataKey="amount" fill="#c9a84c" radius={[4, 4, 0, 0]} name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Billed vs Received */}
      <div className="bg-white dark:bg-navy-800 border border-navy-100 dark:border-navy-700 rounded-2xl p-5 shadow-sm mb-5 animate-fade-in-up delay-5">
        <h3 className="font-display text-base font-bold text-navy dark:text-white mb-1">Billed vs Received</h3>
        <p className="text-navy-400 text-xs mb-3">Monthly cash flow on this project</p>
        {billedVsReceived.length === 0 ? (
          <div className="h-56 flex items-center justify-center text-navy-300 text-sm">No invoices or collections yet.</div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={billedVsReceived}>
              <defs>
                <linearGradient id="bGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1c2143" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#1c2143" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="rGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0f766e" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#0f766e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={t.grid} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: t.axisText }} />
              <YAxis tick={{ fontSize: 11, fill: t.axisText }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: "#1c2143", border: "none", borderRadius: 10, color: "#fff", fontSize: 12 }}
                formatter={(v: number) => fmtAED(v)}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="billed" stroke="#1c2143" strokeWidth={2} fill="url(#bGrad)" name="Billed" />
              <Area type="monotone" dataKey="received" stroke="#0f766e" strokeWidth={2} fill="url(#rGrad)" name="Received" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Recent activity tables */}
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-white dark:bg-navy-800 border border-navy-100 dark:border-navy-700 rounded-2xl p-5 shadow-sm animate-fade-in-up">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-base font-bold text-navy dark:text-white">Recent LPOs</h3>
            <Link href="/dashboard/procurement/lpo/history" className="text-xs text-gold font-semibold hover:underline">View all</Link>
          </div>
          {lpos.length === 0 ? (
            <p className="text-navy-300 text-sm py-6 text-center">No LPOs linked to this project.</p>
          ) : (
            <div className="space-y-2">
              {lpos.slice(0, 5).map(l => (
                <div key={l.id} className="flex items-center justify-between p-3 bg-navy-50 dark:bg-navy-700 rounded-xl">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-navy dark:text-white truncate">LPO-{l.nxrNo} · {l.vendorName}</p>
                    <p className="text-xs text-navy-400">{new Date(l.date).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className="text-sm font-bold text-navy dark:text-white">{fmtAED(l.total || 0)}</p>
                    {l.approved && <span className="text-[10px] text-emerald-600 font-bold">APPROVED</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-navy-800 border border-navy-100 dark:border-navy-700 rounded-2xl p-5 shadow-sm animate-fade-in-up delay-1">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-base font-bold text-navy dark:text-white">Recent Invoices</h3>
            <Link href="/dashboard/accounts/tax-invoice" className="text-xs text-gold font-semibold hover:underline">View all</Link>
          </div>
          {invoices.length === 0 ? (
            <p className="text-navy-300 text-sm py-6 text-center">No invoices yet.</p>
          ) : (
            <div className="space-y-2">
              {invoices.slice(0, 5).map(i => (
                <div key={i.id} className="flex items-center justify-between p-3 bg-navy-50 dark:bg-navy-700 rounded-xl">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-navy dark:text-white truncate">{i.documentNo}</p>
                    <p className="text-xs text-navy-400">{new Date(i.date).toLocaleDateString()}</p>
                  </div>
                  <p className="text-sm font-bold text-navy dark:text-white shrink-0 ml-2">{fmtAED(i.amount || 0)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}