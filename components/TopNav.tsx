"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "./AuthGuard";
import { useRole } from "@/lib/use-role";
import { LogOut, Home } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

export default function TopNav() {
  const router = useRouter();
  const { user } = useAuth();
  const { role } = useRole();

  const handleSignOut = async () => {
    await signOut(auth);
    router.replace("/");
  };

  const isMainAccessible = role === "admin" || role === "viewer";

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-navy-900/95 backdrop-blur-md border-b border-navy-100 dark:border-navy-700 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href={isMainAccessible ? "/dashboard" : "#"} className="flex items-center gap-3 group">
            <img src="/nexayra.png" alt="Nexayra Arc" className="h-9 w-auto transition-transform duration-300 group-hover:scale-105"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          </Link>

          <div className="flex items-center gap-3">
            {isMainAccessible && (
              <Link href="/dashboard" className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-navy dark:text-white hover:bg-navy-50 dark:hover:bg-navy-800 rounded-lg text-sm font-semibold transition-all">
                <Home size={15}/>
              </Link>
            )}
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold text-navy dark:text-white leading-none">{user?.email?.split("@")[0] || "User"}</p>
              <p className="text-[11px] text-navy-400 mt-0.5">{user?.email || ""} {role && <span className="ml-1 px-1.5 py-0.5 bg-navy-50 dark:bg-navy-700 rounded text-[9px] uppercase font-bold">{role}</span>}</p>
            </div>
            <ThemeToggle />
            <button onClick={handleSignOut}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all text-sm font-semibold btn-press">
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}