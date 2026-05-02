"use client";

import { auth } from "@/lib/firebase";
import { capitalize } from "@/lib/format";
import { useEffect, useState } from "react";

type WelcomeBannerProps = {
  tagline: string;
  showName?: boolean;     // default true; set false on sub-pages
  compact?: boolean;      // default false; smaller padding for sub-pages
};

export default function WelcomeBanner({ tagline, showName = true, compact = false }: WelcomeBannerProps) {
  const [name, setName] = useState("there");

  useEffect(() => {
    const email = auth.currentUser?.email || "";
    const prefix = email.split("@")[0];
    setName(capitalize(prefix));
  }, []);

  return (
    <div
      className={`bg-gradient-to-r from-navy to-navy-700 rounded-2xl ${
        compact ? "p-5 mb-4" : "p-8 mb-6"
      } text-white relative overflow-hidden animate-fade-in-up`}
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-1/2 w-48 h-48 bg-gold/10 rounded-full translate-y-1/2 pointer-events-none" />
      <div className="relative z-10">
        {showName && (
          <h1 className={`font-display font-bold mb-2 ${compact ? "text-2xl" : "text-3xl"}`}>
            Welcome back, {name}!
          </h1>
        )}
        <p className="text-navy-200 max-w-2xl text-sm md:text-base">{tagline}</p>
      </div>
    </div>
  );
}