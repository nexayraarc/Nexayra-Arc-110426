"use client";

import { auth } from "@/lib/firebase";
import Link from "next/link";
import GlobalSearch from "@/components/GlobalSearch";
import { Calculator, Building2, ClipboardList, Users, ShoppingCart, FolderKanban, Truck, ArrowRight } from "lucide-react";

const modules = [
  { href: "/dashboard/accounts", label: "Accounts", desc: "Financial records and transactions", icon: Calculator, gradient: "from-emerald-600 to-emerald-700" },
  { href: "/dashboard/company-overview", label: "Company Overview", desc: "Company information and details", icon: Building2, gradient: "from-navy to-navy-700" },
  { href: "/dashboard/estimation", label: "Estimation", desc: "Quotations and proposals", icon: ClipboardList, gradient: "from-gold to-gold-500" },
  { href: "/dashboard/hr", label: "HR", desc: "Employees and payroll", icon: Users, gradient: "from-purple-600 to-purple-700" },
  { href: "/dashboard/logistics", label: "Transportation & Logistics", desc: "Fleet, vehicles, and assignments", icon: Truck, gradient: "from-orange-600 to-orange-700" },
  { href: "/dashboard/procurement", label: "Procurement", desc: "Purchase orders and vendor management", icon: ShoppingCart, gradient: "from-blue-600 to-blue-700" },
  { href: "/dashboard/projects", label: "Projects", desc: "Project tracking and management", icon: FolderKanban, gradient: "from-teal-600 to-teal-700" },
];

export default function DashboardPage() {
  const userName = auth.currentUser?.email?.split("@")[0] || "there";

  return (
    <div>
      <div className="bg-gradient-to-r from-navy to-navy-700 rounded-2xl p-8 mb-8 text-white relative overflow-hidden animate-fade-in-up">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 animate-float" />
        <div className="absolute bottom-0 left-1/2 w-48 h-48 bg-gold/10 rounded-full translate-y-1/2" />
        <div className="relative z-10">
          <h1 className="font-lato text-3xl font-bold mb-2">Welcome back, {userName}!</h1>
          <p className="text-navy-200 max-w-lg">
            Nexayra Arc General Contracting L.L.C. — Manage your operations from one place.
          </p>
        </div>
      </div>

      <div className="mb-8 animate-fade-in-up delay-1">
        <GlobalSearch/>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {modules.map((mod, i) => (
          <Link key={mod.href} href={mod.href}
            className={`animate-fade-in-up delay-${Math.min(i + 2, 5)} group flex items-center gap-4 p-5 rounded-2xl bg-white dark:bg-navy-800 border border-navy-100 dark:border-navy-700 shadow-sm hover-lift`}>
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${mod.gradient} flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
              <mod.icon size={22} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-navy dark:text-white font-bold text-base">{mod.label}</h3>
              <p className="text-navy-400 text-sm">{mod.desc}</p>
            </div>
            <ArrowRight size={18} className="text-navy-300 group-hover:text-navy dark:group-hover:text-white group-hover:translate-x-1 transition-all duration-300 shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}