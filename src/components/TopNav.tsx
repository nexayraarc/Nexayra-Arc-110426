"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "./AuthGuard";
import { LogOut, LayoutDashboard, FileText, FileCheck, Receipt, History } from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/lpo/history", label: "LPO History", icon: History },
  { href: "/dashboard/quotation/history", label: "Quotation History", icon: History },
  { href: "/dashboard/receiver-copy/history", label: "Receipt History", icon: History },
];

export default function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  const handleSignOut = async () => { 
    await signOut(auth);
    router.replace("/");
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-navy-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <img src="/nexayra.png" alt="Nexayra Arc" className="h-12 w-auto transition-transform duration-300 group-hover:scale-105"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            <div>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold text-navy leading-none">{user?.email?.split("@")[0] || "User"}</p>
              <p className="text-[11px] text-navy-400 mt-0.5">{user?.email || ""}</p>
            </div>
            <button onClick={handleSignOut}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-red-500 hover:bg-red-50 transition-all text-sm font-semibold btn-press">
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex gap-0.5 -mb-px overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-1.5 px-3 py-3 text-[13px] font-semibold border-b-2 transition-all duration-200 whitespace-nowrap ${
                  active ? "border-navy text-navy" : "border-transparent text-navy-400 hover:text-navy-600 hover:border-navy-200"
                }`}>
                <item.icon size={14} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
