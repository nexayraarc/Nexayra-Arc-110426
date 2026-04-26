"use client";

import { useTheme } from "@/lib/theme";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const { theme, toggle, mounted } = useTheme();
  if (!mounted) return <div className="w-10 h-10"/>;

  const isDark = theme === "dark";

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="relative w-10 h-10 rounded-xl bg-navy-50 dark:bg-navy-800 border border-navy-200 dark:border-navy-700 flex items-center justify-center overflow-hidden group hover:scale-105 transition-transform btn-press"
    >
      <Sun
        size={18}
        className={`absolute text-amber-500 transition-all duration-500 ${
          isDark ? "opacity-0 -rotate-90 scale-50" : "opacity-100 rotate-0 scale-100"
        }`}
      />
      <Moon
        size={18}
        className={`absolute text-indigo-300 transition-all duration-500 ${
          isDark ? "opacity-100 rotate-0 scale-100" : "opacity-0 rotate-90 scale-50"
        }`}
      />
      <span className={`absolute inset-0 rounded-xl bg-gradient-to-br ${isDark ? "from-indigo-500/10 to-purple-500/5" : "from-amber-400/10 to-orange-300/5"} opacity-0 group-hover:opacity-100 transition-opacity`}/>
    </button>
  );
}