"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiCall } from "@/lib/api-client";
import { fmtAED } from "@/lib/format";
import { useRole } from "@/lib/use-role";
import { Search, Plus, Briefcase, TrendingUp, DollarSign, AlertTriangle, CheckCircle2, Clock, Pause, ArrowRight } from "lucide-react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area,
} from "recharts";
import WelcomeBanner from "@/components/WelcomeBanner";
import { useChartTheme } from "@/lib/chart-theme";
import Loader from "@/components/Loader";
import FloatingActionMenu from "@/components/FloatingActionMenu";
import { FolderPlus, Camera } from "lucide-react";


type Project = {
  id: string;
  code: string;
  name: string;
  client: string;
  location?: string;
  status?: "Planning" | "Ongoing" | "Completed" | "On Hold";
  contractValue: number;
  budgetedCost?: number;
  totalExpenses?: number;
  plannedStart?: string;
  plannedEnd?: string;
  actualProgress?: number;
  projectManager?: string;
};
type PE = { id: string; date: string; amount: number; projectId: string; expenseType?: string };
type Inv = { id: string; date: string; amount: number; projectId: string };
type Col = { id: string; date: string; amount: number; projectId: string; invoiceId?: string };

const STATUS_COLORS: Record<string, string> = {
  Planning: "#4150aa",
  Ongoing: "#c9a84c",
  Completed: "#0f766e",
  "On Hold": "#b91c1c",
};
const TYPE_COLORS = ["#1c2143", "#c9a84c", "#0f766e", "#4150aa", "#6b56b8"];

export default function ProjectsPage() {
   const t = useChartTheme();
  const router = useRouter();
  const { role, loading: roleLoading } = useRole();

  const [projects, setProjects] = useState<Project[]>([]);
  const [projectExp, setProjectExp] = useState<PE[]>([]);
  const [invoices, setInvoices] = useState<Inv[]>([]);
  const [collections, setCollections] = useState<Col[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  useEffect(() => {
    (async () => {
      try {
        const [p, pe, inv, col] = await Promise.all([
          apiCall<{ projects: Project[] }>("/api/accounts-projects"),
          apiCall<{ expenses: PE[] }>("/api/project-expenses"),
          apiCall<{ invoices: Inv[] }>("/api/tax-invoice").catch(() => ({ invoices: [] as Inv[] })),
          apiCall<{ collections: Col[] }>("/api/collections").catch(() => ({ collections: [] as Col[] })),
        ]);
        setProjects(p.projects || []);
        setProjectExp(pe.expenses || []);
        setInvoices(inv.invoices || []);
        setCollections(col.collections || []);
      } catch (err) {
        console.error("Projects dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ---------- Aggregations ----------
  const stats = useMemo(() => {
    const totalContract = projects.reduce((s, p) => s + (p.contractValue || 0), 0);
    const totalBudget = projects.reduce((s, p) => s + (p.budgetedCost || 0), 0);
    const totalSpent = projectExp.reduce((s, e) => s + e.amount, 0);
    const totalBilled = invoices.reduce((s, i) => s + i.amount, 0);
    const totalReceived = collections.reduce((s, c) => s + c.amount, 0);
    const outstanding = totalBilled - totalReceived;
    const active = projects.filter(p => p.status === "Ongoing").length;
    const completed = projects.filter(p => p.status === "Completed").length;
    const overBudget = projects.filter(p => {
      const spent = projectExp.filter(e => e.projectId === p.id).reduce((s, e) => s + e.amount, 0);
      return p.budgetedCost && spent > p.budgetedCost;
    }).length;
    return { totalContract, totalBudget, totalSpent, totalBilled, totalReceived, outstanding, active, completed, overBudget };
  }, [projects, projectExp, invoices, collections]);

  const statusData = useMemo(() => {
    const map = new Map<string, number>();
    projects.forEach(p => {
      const s = p.status || "Planning";
      map.set(s, (map.get(s) || 0) + 1);
    });
    return Array.from(map, ([name, value]) => ({ name, value }));
  }, [projects]);

  const monthlyRevenue = useMemo(() => {
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

  const topProjects = useMemo(() => {
    return [...projects]
      .sort((a, b) => (b.contractValue || 0) - (a.contractValue || 0))
      .slice(0, 5)
      .map(p => {
        const spent = projectExp.filter(e => e.projectId === p.id).reduce((s, e) => s + e.amount, 0);
        return {
          name: p.code || p.name.slice(0, 12),
          contract: p.contractValue || 0,
          spent,
        };
      });
  }, [projects, projectExp]);

  const expenseByType = useMemo(() => {
    const map = new Map<string, number>();
    projectExp.forEach(e => {
      const t = e.expenseType || "misc";
      map.set(t, (map.get(t) || 0) + e.amount);
    });
    return Array.from(map, ([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));
  }, [projectExp]);

  // ---------- Filtered list ----------
  const filtered = useMemo(() => {
    return projects.filter(p => {
      const matchesSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.code?.toLowerCase().includes(search.toLowerCase()) ||
        p.client?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "All" || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [projects, search, statusFilter]);

  if (roleLoading || loading) {
    return <Loader compact />;
  }

  const canCreate = role === "admin" || role === "project-manager";

  return (
    <><div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 animate-fade-in-up">
        <div>

          <p className="text-navy-400 text-sm">Live overview of all active and historical projects.</p>
        </div>
        {canCreate && (
          <Link href="/dashboard/projects/new"
            className="flex items-center gap-2 px-5 py-2.5 bg-navy hover:bg-navy-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm">
            <Plus size={16} /> New Project
          </Link>
        )}
      </div>

      <WelcomeBanner tagline="Track milestones, allocate resources, and deliver on time." compact />

      {/* Search / filter */}
      <div className="bg-white dark:bg-navy-800 border border-navy-100 dark:border-navy-700 rounded-2xl p-5 shadow-sm mb-4 animate-fade-in-up delay-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by project name, code, or client…"
              className="w-full pl-9 pr-4 py-2.5 bg-navy-50 dark:bg-navy-700 border border-navy-100 dark:border-navy-600 rounded-xl text-sm text-navy dark:text-white placeholder-navy-400 focus:outline-none focus:border-gold transition-all" />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-navy-50 dark:bg-navy-700 border border-navy-100 dark:border-navy-600 rounded-xl text-sm text-navy dark:text-white focus:outline-none focus:border-gold transition-all">
            <option value="All">All Status</option>
            <option value="Planning">Planning</option>
            <option value="Ongoing">Ongoing</option>
            <option value="Completed">Completed</option>
            <option value="On Hold">On Hold</option>
          </select>
          <span className="text-xs text-navy-400 font-semibold">
            {filtered.length} of {projects.length} projects
          </span>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {[
          { label: "Total Projects", value: projects.length, icon: Briefcase, color: "from-navy to-navy-700", text: "text-white" },
          { label: "Active", value: stats.active, icon: TrendingUp, color: "from-gold to-gold-500", text: "text-navy" },
          { label: "Contract Value", value: fmtAED(stats.totalContract), icon: DollarSign, color: "from-teal-600 to-teal-700", text: "text-white" },
          { label: "Total Billed", value: fmtAED(stats.totalBilled), icon: CheckCircle2, color: "from-indigo-600 to-indigo-700", text: "text-white" },
          { label: "Total Received", value: fmtAED(stats.totalReceived), icon: TrendingUp, color: "from-emerald-600 to-emerald-700", text: "text-white" },
          { label: "Outstanding", value: fmtAED(stats.outstanding), icon: AlertTriangle, color: "from-rose-600 to-rose-700", text: "text-white" },
        ].map((k, i) => (
          <div key={k.label}
            className={`bg-gradient-to-br ${k.color} ${k.text} rounded-2xl p-4 shadow-sm animate-fade-in-up`}
            style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="flex items-center justify-between mb-2">
              <k.icon size={18} className="opacity-80" />
            </div>
            <p className="text-xs font-semibold uppercase opacity-80">{k.label}</p>
            <p className="text-lg font-bold mt-1 truncate">{k.value}</p>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid lg:grid-cols-3 gap-5 mb-5">
        {/* Status distribution */}
        <div className="bg-white dark:bg-navy-800 border border-navy-100 dark:border-navy-700 rounded-2xl p-5 shadow-sm animate-fade-in-up delay-1">
          <h3 className="font-display text-base font-bold text-navy dark:text-white mb-1">Projects by Status</h3>
          <p className="text-navy-400 text-xs mb-3">Distribution across lifecycle stages</p>
          {statusData.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-navy-300 text-sm">No projects yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={3} dataKey="value" stroke="none">
                  {statusData.map((entry) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || "#888"} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#1c2143", border: "none", borderRadius: 10, color: "#fff", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top projects bar chart */}
        <div className="bg-white dark:bg-navy-800 border border-navy-100 dark:border-navy-700 rounded-2xl p-5 shadow-sm animate-fade-in-up delay-2">
          <h3 className="font-display text-base font-bold text-navy dark:text-white mb-1">Top 5 Projects — Contract vs Spent</h3>
          <p className="text-navy-400 text-xs mb-3">Highest value projects in the portfolio</p>
          {topProjects.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-navy-300 text-sm">No data.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topProjects}>
                <CartesianGrid strokeDasharray="3 3" stroke={t.grid} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: t.axisText }} />
                <YAxis tick={{ fontSize: 11, fill: t.axisText }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: "#1c2143", border: "none", borderRadius: 10, color: "#fff", fontSize: 12 }}
                  formatter={(v: number) => fmtAED(v)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="contract" fill="#1c2143" name="Contract" radius={[4, 4, 0, 0]} />
                <Bar dataKey="spent" fill="#c9a84c" name="Spent" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Expense breakdown */}
        <div className="bg-white dark:bg-navy-800 border border-navy-100 dark:border-navy-700 rounded-2xl p-5 shadow-sm animate-fade-in-up delay-3">
          <h3 className="font-display text-base font-bold text-navy dark:text-white mb-1">Cost by Category</h3>
          <p className="text-navy-400 text-xs mb-3">All projects combined</p>
          {expenseByType.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-navy-300 text-sm">No expenses yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={expenseByType} cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={3} dataKey="value" stroke="none">
                  {expenseByType.map((_, i) => (
                    <Cell key={i} fill={TYPE_COLORS[i % TYPE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "#1c2143", border: "none", borderRadius: 10, color: "#fff", fontSize: 12 }}
                  formatter={(v: number) => fmtAED(v)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Charts row 2 — Monthly billing/collection */}
      <div className="bg-white dark:bg-navy-800 border border-navy-100 dark:border-navy-700 rounded-2xl p-5 shadow-sm mb-6 animate-fade-in-up delay-4">
        <h3 className="font-display text-base font-bold text-navy dark:text-white mb-1">Billed vs Received — Last 12 Months</h3>
        <p className="text-navy-400 text-xs mb-3">Cash flow trend across projects</p>
        {monthlyRevenue.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-navy-300 text-sm">No invoices or collections yet.</div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={monthlyRevenue}>
              <defs>
                <linearGradient id="billedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1c2143" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#1c2143" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="recvGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#c9a84c" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#c9a84c" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={t.grid} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: t.axisText }} />
              <YAxis tick={{ fontSize: 11, fill: t.axisText }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: "#1c2143", border: "none", borderRadius: 10, color: "#fff", fontSize: 12 }}
                formatter={(v: number) => fmtAED(v)} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="billed" stroke="#1c2143" strokeWidth={2} fill="url(#billedGrad)" name="Billed" />
              <Area type="monotone" dataKey="received" stroke="#c9a84c" strokeWidth={2} fill="url(#recvGrad)" name="Received" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>



      {/* Project list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-navy-800 rounded-2xl border border-navy-100 dark:border-navy-700">
          <Briefcase size={36} className="mx-auto text-navy-300 mb-3" />
          <p className="text-navy-400">No projects match your filters.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p, i) => {
            const spent = projectExp.filter(e => e.projectId === p.id).reduce((s, e) => s + e.amount, 0);
            const billed = invoices.filter(inv => inv.projectId === p.id).reduce((s, inv) => s + inv.amount, 0);
            const utilization = p.budgetedCost ? Math.min(100, (spent / p.budgetedCost) * 100) : 0;
            const overBudget = p.budgetedCost ? spent > p.budgetedCost : false;
            const StatusIcon = p.status === "Completed" ? CheckCircle2 : p.status === "On Hold" ? Pause : Clock;
            return (
              <button
                key={p.id}
                onClick={() => router.push(`/dashboard/projects/${p.id}`)}
                className="text-left bg-white dark:bg-navy-800 border border-navy-100 dark:border-navy-700 rounded-2xl p-5 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all animate-fade-in-up"
                style={{ animationDelay: `${i * 0.04}s` }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-navy-400 text-xs font-semibold">{p.code}</p>
                    <h3 className="font-bold text-navy dark:text-white truncate">{p.name}</h3>
                    <p className="text-navy-400 text-sm truncate">{p.client}</p>
                  </div>
                  <ArrowRight size={16} className="text-navy-300 shrink-0 mt-1" />
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg"
                    style={{ background: `${STATUS_COLORS[p.status || "Planning"]}20`, color: STATUS_COLORS[p.status || "Planning"] }}>
                    <StatusIcon size={11} /> {p.status || "Planning"}
                  </span>
                  {overBudget && (
                    <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-lg">Over budget</span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <p className="text-navy-400 text-[10px] uppercase font-bold">Contract</p>
                    <p className="text-sm font-bold text-navy dark:text-white">{fmtAED(p.contractValue || 0)}</p>
                  </div>
                  <div>
                    <p className="text-navy-400 text-[10px] uppercase font-bold">Billed</p>
                    <p className="text-sm font-bold text-navy dark:text-white">{fmtAED(billed)}</p>
                  </div>
                </div>
                {p.budgetedCost && p.budgetedCost > 0 && (
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-semibold mb-1">
                      <span className="text-navy-400">BUDGET USED</span>
                      <span className={overBudget ? "text-red-600" : "text-navy"}>{utilization.toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 bg-navy-50 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${overBudget ? "bg-red-500" : "bg-gold"}`}
                        style={{ width: `${utilization}%` }} />
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

      )}
    </div><FloatingActionMenu
        actions={[
          { icon: FolderPlus, label: "Create New Project", href: "/dashboard/projects/new" },
          { icon: Camera, label: "Log Site Progress Photo", onClick: () => alert("Site progress photo upload coming soon — will tie into Marketing module.") },
          { icon: AlertTriangle, label: "Report Site Issue/Delay", onClick: () => alert("Issue reporting workflow coming soon.") },
        ]} /></>
  );
}
