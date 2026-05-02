"use client";

import { useEffect, useState } from "react";

export type ChartTheme = {
  grid: string;
  axisText: string;
  tooltipStyle: React.CSSProperties;
  /** Legend text color */
  legendText: string;
};

function readChartVars(): ChartTheme {
  if (typeof window === "undefined") {
    return {
      grid: "#e5e7eb",
      axisText: "#4a5568",
      legendText: "#4a5568",
      tooltipStyle: { background: "#192A56", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#ffffff", fontSize: 12 },
    };
  }
  const styles = getComputedStyle(document.documentElement);
  const r = (varName: string) => `rgb(${styles.getPropertyValue(varName).trim()})`;

  return {
    grid: r("--c-chart-grid"),
    axisText: r("--c-chart-text"),
    legendText: r("--c-chart-text"),
    tooltipStyle: {
      background: r("--c-chart-tooltip-bg"),
      border: "1px solid rgba(255,255,255,0.12)",
      borderRadius: 10,
      color: r("--c-chart-tooltip-fg"),
      fontSize: 12,
      padding: "8px 12px",
    },
  };
}

export function useChartTheme(): ChartTheme {
  const [theme, setTheme] = useState<ChartTheme>(() => readChartVars());

  useEffect(() => {
    const update = () => setTheme(readChartVars());
    update();

    // Re-read whenever the .dark class flips on <html>
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return theme;
}