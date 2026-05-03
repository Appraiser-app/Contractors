import { createClient } from "@supabase/supabase-js";

// Admin Supabase client (bypasses RLS) for server-side use only
export const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// --- Profiles ---
export async function getProfileById(id: string) {
  const { data } = await db.from("Profile").select("*").eq("id", id).single();
  return data as Profile | null;
}

export async function getAllProfiles() {
  const { data } = await db.from("Profile").select("*").order("createdAt", { ascending: true });
  return (data || []) as Profile[];
}

export async function createProfile(profile: { id: string; email: string; name: string; role: "ADMIN" | "SECRETARY" }) {
  const { data, error } = await db.from("Profile").insert(profile).select().single();
  if (error) throw error;
  return data as Profile;
}

export async function updateProfileRole(id: string, role: "ADMIN" | "SECRETARY") {
  const { error } = await db.from("Profile").update({ role, updatedAt: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}

export async function deleteProfile(id: string) {
  const { error } = await db.from("Profile").delete().eq("id", id);
  if (error) throw error;
}

export async function countAdmins() {
  const { count, error } = await db.from("Profile").select("id", { count: "exact", head: true }).eq("role", "ADMIN");
  if (error) throw error;
  return count || 0;
}

// --- Work Sites ---
export async function getAllSites() {
  const { data } = await db.from("WorkSite").select("*, transactions:Transaction(*)").order("createdAt", { ascending: false });
  return (data || []) as WorkSite[];
}

export async function getSiteById(id: string) {
  const { data } = await db.from("WorkSite").select("*, transactions:Transaction(*)").eq("id", id).single();
  return data as WorkSite | null;
}

export async function createSite(siteData: Partial<WorkSite>) {
  const { data, error } = await db.from("WorkSite").insert({
    ...siteData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }).select().single();
  if (error) throw error;
  return data as WorkSite;
}

export async function updateSite(id: string, siteData: Partial<WorkSite>) {
  const { data, error } = await db.from("WorkSite").update({
    ...siteData,
    updatedAt: new Date().toISOString(),
  }).eq("id", id).select().single();
  if (error) throw error;
  return data as WorkSite;
}

export async function deleteSite(id: string) {
  const { error } = await db.from("WorkSite").delete().eq("id", id);
  if (error) throw error;
}

// --- Transactions ---
export async function getAllTransactions() {
  const { data } = await db.from("Transaction").select("*, workSite:WorkSite(*)").order("date", { ascending: false });
  return (data || []) as Transaction[];
}

export async function createTransaction(txData: Partial<Transaction> & { workSiteId: string }) {
  const { data, error } = await db.from("Transaction").insert({
    ...txData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }).select().single();
  if (error) throw error;
  return data as Transaction;
}

export async function deleteTransaction(id: string) {
  const { error } = await db.from("Transaction").delete().eq("id", id);
  if (error) throw error;
}

// --- Types ---
export type Profile = {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "SECRETARY";
  createdAt: string;
  updatedAt: string;
};

export type WorkSite = {
  id: string;
  name: string;
  location: string | null;
  description: string | null;
  clientName: string | null;
  contractValue: number | null;
  status: "ACTIVE" | "COMPLETED" | "ON_HOLD";
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  transactions?: Transaction[];
};

export type Transaction = {
  id: string;
  workSiteId: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  description: string;
  category: string | null;
  date: string;
  createdAt: string;
  updatedAt: string;
  workSite?: WorkSite;
};
