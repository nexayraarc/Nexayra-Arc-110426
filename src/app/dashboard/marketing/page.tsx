"use client";

import { Megaphone, Construction } from "lucide-react";
import WelcomeBanner from "@/components/WelcomeBanner";
import ModuleSearchBar from "@/components/ModuleSearchBar";

export default function MarketingPage() {
  return (
    <div>
      <WelcomeBanner tagline="Centralize your brand assets, schedule content, and automate your outreach." />
      <ModuleSearchBar module="marketing" placeholder="Search marketing materials…" />

      <div className="bg-white dark:bg-navy-800 border border-navy-100 dark:border-navy-700 rounded-2xl p-12 text-center shadow-sm animate-fade-in-up delay-1">
        <div className="w-16 h-16 rounded-2xl bg-pink-500 mx-auto mb-4 flex items-center justify-center">
          <Megaphone size={28} className="text-white" />
        </div>
        <h2 className="font-display text-2xl font-bold text-navy dark:text-white mb-2">
          Social Media & Marketing
        </h2>
        <p className="text-navy-400 max-w-md mx-auto mb-6">
          This module is being designed. Tell us what you want it to include — content calendar, AI post generator, brand asset library, campaign tracker — and we'll build it next.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800 rounded-xl text-pink-700 dark:text-pink-400 text-sm font-semibold">
          <Construction size={14} /> Coming soon
        </div>
      </div>
    </div>
  );
}