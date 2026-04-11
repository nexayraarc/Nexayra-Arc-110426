"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "./AuthGuard";
import { LogOut, LayoutDashboard, FileText, FileCheck, Receipt, History, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const MODULES = [
  {
    key: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    children: [],
  },
  {
    key: "lpo",
    label: "LPO",
    icon: FileText,
    href: "/dashboard/lpo",
    children: [
      { label: "Create LPO", href: "/dashboard/lpo" },
      { label: "LPO History", href: "/dashboard/lpo/history" },
    ],
  },
  {
    key: "quotation",
    label: "Quotation",
    icon: FileCheck,
    href: "/dashboard/quotation",
    children: [
      { label: "Create Quotation", href: "/dashboard/quotation" },
      { label: "Quotation History", href: "/dashboard/quotation/history" },
    ],
  },
  {
    key: "receiver-copy",
    label: "Receiver Copy",
    icon: Receipt,
    href: "/dashboard/receiver-copy",
    children: [
      { label: "Create Receipt", href: "/dashboard/receiver-copy" },
      { label: "Receipt History", href: "/dashboard/receiver-copy/history" },
    ],
  },
];

export default function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSignOut = async () => {
    await signOut(auth);
    router.replace("/");
  };

  const isActive = (mod: typeof MODULES[0]) => {
    if (mod.key === "dashboard") return pathname === "/dashboard";
    return pathname.startsWith(`/dashboard/${mod.key}`);
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-navy-100 shadow-sm">
      {/* Top bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <img
              src="/nexayra.png"
              alt="Nexayra Arc"
              className="h-9 w-auto transition-transform group-hover:scale-105"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <div>
            </div>
          </Link>

          {/* User + Logout */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold text-navy leading-none">{user?.email?.split("@")[0] || "User"}</p>
              <p className="text-[11px] text-navy-400 mt-0.5">{user?.email || ""}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-red-500 hover:bg-red-50 transition-all text-sm font-semibold"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" ref={dropdownRef}>
        <nav className="flex gap-1 -mb-px overflow-x-auto scrollbar-none">
          {MODULES.map((mod) => {
            const active = isActive(mod);
            const hasChildren = mod.children.length > 0;
            const isOpen = openDropdown === mod.key;

            return (
              <div key={mod.key} className="relative">
                <button
                  onClick={() => {
                    if (hasChildren) {
                      setOpenDropdown(isOpen ? null : mod.key);
                    } else {
                      setOpenDropdown(null);
                      router.push(mod.href);
                    }
                  }}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                    active
                      ? "border-navy text-navy"
                      : "border-transparent text-navy-400 hover:text-navy-600 hover:border-navy-200"
                  }`}
                >
                  <mod.icon size={16} />
                  {mod.label}
                  {hasChildren && (
                    <ChevronDown size={14} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  )}
                </button>

                {/* Dropdown */}
                {hasChildren && isOpen && (
                  <div className="absolute top-full left-0 mt-0.5 bg-white rounded-xl shadow-lg shadow-navy/10 border border-navy-100 py-1 min-w-[200px] z-50 animate-scale-in">
                    {mod.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={() => setOpenDropdown(null)}
                        className={`block px-4 py-2.5 text-sm transition-all ${
                          pathname === child.href
                            ? "bg-navy-50 text-navy font-semibold"
                            : "text-navy-500 hover:bg-navy-50 hover:text-navy"
                        }`}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
