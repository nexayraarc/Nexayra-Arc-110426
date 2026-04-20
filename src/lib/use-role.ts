"use client";

import { useEffect, useState } from "react";
import { apiCall } from "./api-client";

export type UserRole = "admin" | "accounts" | "viewer";

export function useRole() {
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiCall<{ role: UserRole }>("/api/me");
        setRole(res.role);
      } catch {
        setRole("viewer");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { role, loading, canWrite: role === "admin" || role === "accounts" };
}