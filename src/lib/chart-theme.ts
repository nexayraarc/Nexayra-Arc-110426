"use client";

import { useEffect, useState } from "react";

export type ChartTheme = {
  grid: string;
  axisText: string;
  tooltipBg: string;
  tooltipBorder: string;
  tooltipText: string;
  tooltipStyle: React.CSSProperties;
};

const lightTheme: ChartTheme = {
  grid: "#e5e7eb",
  axisText: "#5c6691",
  tooltipBg: "#1c2143",
  tooltipBorder: "rgba(255,255,255,0.1)",
  tooltipText: "#ffffff",
  tooltipStyle: {
    background: "#1c2143",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10,
    color: "#ffffff",
    fontSize: 12,
  },
};

const darkTheme: ChartTheme = {
  grid: "rgba(255,255,255,0.08)",
  axisText: "#919eC8",
  tooltipBg: "#0f1529",
  tooltipBorder: "rgba(255,255,255,0.15)",
  tooltipText: "#e6eaf5",
  tooltipStyle: {
    background: "#0f1529",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: 10,
    color: "#e6eaf5",
    fontSize: 12,
  },
};

export function useChartTheme(): ChartTheme {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const check = () => setIsDark(document.documentElement.classList.contains("dark"));
    check();

    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return isDark ? darkTheme : lightTheme;
}