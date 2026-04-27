"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { apiCall } from "@/lib/api-client";
import {
  Calculator, Building2, FileCheck, Users, Truck, ShoppingCart, Briefcase,
  ArrowRight, Search,
} from "lucide-react";

type SearchResult = { type: string; label: string; href: string };

const MODULES = [
  { href: "/dashboard/accounts",         label: "Accounts",                 desc: "Financial records and transactions",     icon: Calculator,    iconBg: "bg-emerald-500" },
  { href: "/dashboard/company-overview", label: "Company Overview",         desc: "Company information and details",        icon: Building2,     iconBg: "bg-navy" },
  { href: "/dashboard/estimation",       label: "Estimation",               desc: "Quotations and proposals",               icon: FileCheck,     iconBg: "bg-gold" },
  { href: "/dashboard/hr",               label: "HR",                       desc: "Employees and payroll",                  icon: Users,         iconBg: "bg-purple-500" },
  { href: "/dashboard/logistics",        label: "Transportation & Logistics", desc: "Fleet, vehicles, and assignments",     icon: Truck,         iconBg: "bg-orange-500" },
  { href: "/dashboard/procurement",      label: "Procurement",              desc: "Purchase orders and vendor management",  icon: ShoppingCart,  iconBg: "bg-blue-500" },
  { href: "/dashboard/projects",         label: "Projects",                 desc: "Project tracking and management",        icon: Briefcase,     iconBg: "bg-teal-500" },
];

export default function DashboardPage() {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const userName = auth.currentUser?.email?.split("@")[0] || "there";

  useEffect(() => {
    if (search.trim().length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await apiCall<{ results: SearchResult[] }>(`/api/search?q=${encodeURIComponent(search)}`);
        setResults(res.results || []);
      } catch { setResults([]); }
      finally { setSearching(false); }
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <div>
      {/* Welcome banner — intentionally always dark navy (brand) */}
      <div className="bg-gradient-to-r from-navy to-navy-700 rounded-2xl p-8 mb-6 text-white relative overflow-hidden animate-fade-in-up">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-1/2 w-48 h-48 bg-gold/10 rounded-full translate-y-1/2" />
        <div className="relative z-10">
          <h1 className="font-display text-3xl font-bold mb-2">Welcome back, {userName}!</h1>
          <p className="text-navy-200 max-w-lg">
            Nexayra Arc General Contracting L.L.C. — Manage your operations from one place.
          </p>
        </div>
      </div>

      {/* Global search */}
      <div className="relative mb-6 animate-fade-in-up delay-1">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-navy-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search LPOs, quotations, invoices, partners, projects, expenses…"
          className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-navy-800 border border-navy-100 dark:border-navy-700 rounded-2xl text-sm text-navy dark:text-white placeholder-navy-400 focus:outline-none focus:border-gold transition-all shadow-sm"
        />
        {search.trim().length >= 2 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-navy-800 border border-navy-100 dark:border-navy-700 rounded-2xl shadow-lg max-h-80 overflow-y-auto z-30">
            {searching ? (
              <div className="p-4 text-center text-navy-400 text-sm">Searching…</div>
            ) : results.length === 0 ? (
              <div className="p-4 text-center text-navy-400 text-sm">No results found.</div>
            ) : (
              results.map((r, i) => (
                <Link key={i} href={r.href}
                  className="flex items-center justify-between p-3 hover:bg-navy-50 dark:hover:bg-navy-700 transition-all border-b border-navy-50 dark:border-navy-700 last:border-0">
                  <div>
                    <p className="text-xs text-navy-400 font-bold uppercase">{r.type}</p>
                    <p className="text-sm text-navy dark:text-white font-semibold">{r.label}</p>
                  </div>
                  <ArrowRight size={14} className="text-navy-300" />
                </Link>
              ))
            )}
          </div>
        )}
      </div>

      {/* Module grid — properly light/dark aware */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {MODULES.map((mod, i) => (
          <Link
            key={mod.href}
            href={mod.href}
            className="group flex items-center gap-4 p-5 rounded-2xl bg-white dark:bg-navy-800 border border-navy-100 dark:border-navy-700 hover:border-gold dark:hover:border-gold hover:shadow-md hover:scale-[1.01] transition-all duration-200 shadow-sm animate-fade-in-up"
            style={{ animationDelay: `${0.1 + i * 0.05}s` }}>
            <div className={`w-12 h-12 rounded-xl ${mod.iconBg} flex items-center justify-center shrink-0 shadow-sm`}>
              <mod.icon size={22} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-navy dark:text-white font-bold">{mod.label}</h3>
              <p className="text-navy-400 text-sm">{mod.desc}</p>
            </div>
            <ArrowRight size={16} className="text-navy-300 group-hover:text-gold group-hover:translate-x-0.5 transition-all shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}