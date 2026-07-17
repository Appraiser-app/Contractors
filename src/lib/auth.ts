import { getProfileById } from "@/lib/db";
import { adminAuth } from "@/lib/firebase-admin";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function getUser() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("__session")?.value;
    if (!sessionCookie) return null;
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    return { id: decoded.uid, email: decoded.email || "" };
  } catch {
    return null;
  }
}

export async function getProfile() {
  const user = await getUser();
  if (!user) return null;
  return getProfileById(user.id);
}

export async function requireAuth() {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin() {
  const profile = await getProfile();
  if (!profile || profile.role !== "ADMIN") redirect("/dashboard");
  return profile;
}

export function isAdmin(role: string) {
  return role === "ADMIN";
}
