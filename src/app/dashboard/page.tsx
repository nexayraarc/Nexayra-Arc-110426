"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiCall } from "@/lib/api-client";
import {
  Calculator, Building2, FileCheck, Users, Truck, ShoppingCart, Briefcase,
  ArrowRight, Search, Megaphone,
} from "lucide-react";
import WelcomeBanner from "@/components/WelcomeBanner";

type SearchResult = { type: string; label: string; href: string };

const MODULES = [
  { href: "/dashboard/accounts",         label: "Accounts",                 desc: "Financial records and transactions",     icon: Calculator,    iconBg: "bg-emerald-500" },
  { href: "/dashboard/company-overview", label: "Company Overview",         desc: "Company information and details",        icon: Building2,     iconBg: "bg-navy" },
  { href: "/dashboard/estimation",       label: "Estimation",               desc: "Quotations and proposals",               icon: FileCheck,     iconBg: "bg-gold" },
  { href: "/dashboard/hr",               label: "HR",                       desc: "Employees and payroll",                  icon: Users,         iconBg: "bg-purple-500" },
  { href: "/dashboard/logistics",        label: "Transportation & Logistics", desc: "Fleet, vehicles, and assignments",     icon: Truck,         iconBg: "bg-orange-500" },
  { href: "/dashboard/procurement",      label: "Procurement",              desc: "Purchase orders and vendor management",  icon: ShoppingCart,  iconBg: "bg-blue-500" },
  { href: "/dashboard/projects",         label: "Projects",                 desc: "Project tracking and management",        icon: Briefcase,     iconBg: "bg-teal-500" },
  { href: "/dashboard/marketing",        label: "Social Media & Marketing", desc: "Brand assets, content, and outreach",    icon: Megaphone,     iconBg: "bg-pink-500" },
];

export default function DashboardPage() {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

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

  const showResults = search.trim().length >= 2;

  return (
    <div>
      {/* Welcome banner */}
      <WelcomeBanner tagline="Nexayra Arc General Contracting L.L.C. — Manage your operations from one place." />

      {/* Global search — INLINE, pushes content below it */}
      <div className="mb-6 animate-fade-in-up delay-1">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-navy-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search LPOs, quotations, invoices, partners, projects, expenses…"
            className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-navy-800 border border-navy-100 dark:border-navy-700 rounded-2xl text-sm text-navy dark:text-white placeholder-navy-400 focus:outline-none focus:border-gold transition-all shadow-sm"
          />
        </div>

        {/* Inline results — sit BELOW the search bar, pushing modules down */}
        {showResults && (
          <div className="mt-3 bg-white dark:bg-navy-800 border border-navy-100 dark:border-navy-700 rounded-2xl shadow-md overflow-hidden animate-fade-in-up">
            {searching ? (
              <div className="p-4 text-center text-navy-400 text-sm">Searching…</div>
            ) : results.length === 0 ? (
              <div className="p-4 text-center text-navy-400 text-sm">No results found.</div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                {results.map((r, i) => (
                  <Link
                    key={i}
                    href={r.href}
                    className="flex items-center justify-between p-3 hover:bg-navy-50 dark:hover:bg-navy-700 transition-all border-b border-navy-50 dark:border-navy-700 last:border-0"
                  >
                    <div>
                      <p className="text-xs text-navy-400 font-bold uppercase">{r.type}</p>
                      <p className="text-sm text-navy dark:text-white font-semibold">{r.label}</p>
                    </div>
                    <ArrowRight size={14} className="text-navy-300" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Module grid — now properly pushed down when search results show */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {MODULES.map((mod, i) => (
          <Link
            key={mod.href}
            href={mod.href}
            className="group flex items-center gap-4 p-5 rounded-2xl bg-white dark:bg-navy-800 border border-navy-100 dark:border-navy-700 hover:border-gold dark:hover:border-gold hover:shadow-md hover:scale-[1.01] transition-all duration-200 shadow-sm animate-fade-in-up"
            style={{ animationDelay: `${0.1 + i * 0.05}s` }}
          >
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