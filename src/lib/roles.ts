import { adminDb } from "./firebase-admin";

export type UserRole = "admin" | "accounts" | "viewer";

export async function getUserRole(uid: string): Promise<UserRole> {
  if (!adminDb) {
    console.error("Firebase Admin DB not initialized");
    return "viewer";
  }
  try {
    const doc = await adminDb.collection("users").doc(uid).get();
    if (!doc.exists) return "viewer";
    return (doc.data()?.role || "viewer") as UserRole;
  } catch (error: any) {
    console.error("Error getting user role:", error.message);
    return "viewer";
  }
}

export function canWriteAccounts(role: UserRole): boolean {
  return role === "admin" || role === "accounts";
}

export function canViewAccounts(role: UserRole): boolean {
  return role === "admin" || role === "accounts" || role === "viewer";
}