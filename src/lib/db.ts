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
  const { data, error } = await db.from("Profile").insert({ ...profile, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }).select().single();
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
  const { data, error } = await db.from("WorkSite").insert({ ...siteData, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }).select().single();
  if (error) throw error;
  return data as WorkSite;
}

export async function updateSite(id: string, siteData: Partial<WorkSite>) {
  const { data, error } = await db.from("WorkSite").update({ ...siteData, updatedAt: new Date().toISOString() }).eq("id", id).select().single();
  if (error) throw error;
  return data as WorkSite;
}

export async function deleteSite(id: string) {
  const { error } = await db.from("WorkSite").delete().eq("id", id);
  if (error) throw error;
}

// --- Transactions ---
export async function getAllTransactions() {
  const { data } = await db.from("Transaction").select("*, workSite:WorkSite(id,name)").order("date", { ascending: false });
  return (data || []) as Transaction[];
}

export async function createTransaction(txData: Partial<Transaction> & { workSiteId: string }) {
  const { data, error } = await db.from("Transaction").insert({ ...txData, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }).select().single();
  if (error) throw error;
  return data as Transaction;
}

export async function deleteTransaction(id: string) {
  const { error } = await db.from("Transaction").delete().eq("id", id);
  if (error) throw error;
}

// --- Equipment ---
export async function getAllEquipment() {
  const { data } = await db.from("Equipment").select("*, maintenance:MaintenanceRecord(*), insurances:Insurance(*), expenses:EquipmentExpense(*), documents:Document(*)").order("createdAt", { ascending: false });
  return (data || []) as Equipment[];
}

export async function getEquipmentById(id: string) {
  const { data } = await db.from("Equipment").select("*, maintenance:MaintenanceRecord(*), insurances:Insurance(*), expenses:EquipmentExpense(*), documents:Document(*)").eq("id", id).single();
  return data as Equipment | null;
}

export async function createEquipment(eq: Partial<Equipment>) {
  const { data, error } = await db.from("Equipment").insert({ ...eq, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }).select().single();
  if (error) throw error;
  return data as Equipment;
}

export async function updateEquipment(id: string, eq: Partial<Equipment>) {
  const { data, error } = await db.from("Equipment").update({ ...eq, updatedAt: new Date().toISOString() }).eq("id", id).select().single();
  if (error) throw error;
  return data as Equipment;
}

export async function deleteEquipment(id: string) {
  const { error } = await db.from("Equipment").delete().eq("id", id);
  if (error) throw error;
}

// --- Maintenance ---
export async function createMaintenance(data: Partial<MaintenanceRecord> & { equipmentId: string }) {
  const { data: rec, error } = await db.from("MaintenanceRecord").insert({ ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }).select().single();
  if (error) throw error;
  return rec as MaintenanceRecord;
}

export async function deleteMaintenance(id: string) {
  const { error } = await db.from("MaintenanceRecord").delete().eq("id", id);
  if (error) throw error;
}

// --- Insurance ---
export async function createInsurance(data: Partial<Insurance> & { equipmentId: string }) {
  const { data: ins, error } = await db.from("Insurance").insert({ ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }).select().single();
  if (error) throw error;
  return ins as Insurance;
}

export async function updateInsurance(id: string, data: Partial<Insurance>) {
  const { error } = await db.from("Insurance").update({ ...data, updatedAt: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}

export async function deleteInsurance(id: string) {
  const { error } = await db.from("Insurance").delete().eq("id", id);
  if (error) throw error;
}

// --- Equipment Expenses ---
export async function createEquipmentExpense(data: Partial<EquipmentExpense> & { equipmentId: string }) {
  const { data: exp, error } = await db.from("EquipmentExpense").insert({ ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }).select().single();
  if (error) throw error;
  return exp as EquipmentExpense;
}

export async function deleteEquipmentExpense(id: string) {
  const { error } = await db.from("EquipmentExpense").delete().eq("id", id);
  if (error) throw error;
}

// --- Documents ---
export async function getAllDocuments() {
  const { data } = await db.from("Document").select("*, equipment:Equipment(id,name,type)").order("createdAt", { ascending: false });
  return (data || []) as Document[];
}

export async function getExpiringDocuments(days = 30) {
  const future = new Date();
  future.setDate(future.getDate() + days);
  const { data } = await db.from("Document").select("*, equipment:Equipment(id,name,type)").not("expiryDate", "is", null).lte("expiryDate", future.toISOString()).order("expiryDate", { ascending: true });
  return (data || []) as Document[];
}

export async function createDocument(doc: Partial<Document>) {
  const { data, error } = await db.from("Document").insert({ ...doc, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }).select().single();
  if (error) throw error;
  return data as Document;
}

export async function deleteDocument(id: string) {
  const { error } = await db.from("Document").delete().eq("id", id);
  if (error) throw error;
}

// --- Tasks ---
export async function getAllTasks() {
  const { data } = await db.from("Task").select("*").order("createdAt", { ascending: false });
  return (data || []) as Task[];
}

export async function createTask(task: Partial<Task>) {
  const { data, error } = await db.from("Task").insert({ ...task, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }).select().single();
  if (error) throw error;
  return data as Task;
}

export async function updateTask(id: string, updates: Partial<Task>) {
  const { error } = await db.from("Task").update({ ...updates, updatedAt: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}

export async function deleteTask(id: string) {
  const { error } = await db.from("Task").delete().eq("id", id);
  if (error) throw error;
}

// --- Types ---
export type Profile = {
  id: string; email: string; name: string; role: "ADMIN" | "SECRETARY";
  createdAt: string; updatedAt: string;
};

export type WorkSite = {
  id: string; name: string; location: string | null; description: string | null;
  clientName: string | null; contractValue: number | null;
  status: "ACTIVE" | "COMPLETED" | "ON_HOLD";
  startDate: string | null; endDate: string | null;
  createdAt: string; updatedAt: string;
  transactions?: Transaction[];
};

export type Transaction = {
  id: string; workSiteId: string; type: "INCOME" | "EXPENSE";
  amount: number; description: string; category: string | null; date: string;
  receiptUrl: string | null;
  createdAt: string; updatedAt: string; workSite?: Partial<WorkSite>;
};

export type Equipment = {
  id: string; name: string; type: "TRUCK" | "MINI_EXCAVATOR" | "BOBCAT" | "OTHER";
  licensePlate: string | null; year: number | null; description: string | null;
  status: "ACTIVE" | "IN_REPAIR" | "INACTIVE";
  createdAt: string; updatedAt: string;
  maintenance?: MaintenanceRecord[];
  insurances?: Insurance[];
  expenses?: EquipmentExpense[];
  documents?: Document[];
};

export type MaintenanceRecord = {
  id: string; equipmentId: string; description: string;
  cost: number | null; date: string; mileage: number | null; notes: string | null;
  createdAt: string; updatedAt: string;
};

export type Insurance = {
  id: string; equipmentId: string; type: string;
  company: string | null; policyNumber: string | null;
  startDate: string; endDate: string; cost: number; isPaid: boolean;
  createdAt: string; updatedAt: string;
};

export type EquipmentExpense = {
  id: string; equipmentId: string; category: string;
  amount: number; description: string; date: string;
  receiptUrl: string | null;
  createdAt: string; updatedAt: string;
};

export type Document = {
  id: string; title: string;
  type: "LICENSE" | "INSURANCE" | "PERMIT" | "CONTRACT" | "RECEIPT" | "OTHER";
  fileUrl: string | null; expiryDate: string | null; notes: string | null;
  equipmentId: string | null;
  createdAt: string; updatedAt: string;
  equipment?: Partial<Equipment> | null;
};

export type Task = {
  id: string;
  title: string;
  description: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate: string | null;
  assignedTo: string | null;
  siteId: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};
