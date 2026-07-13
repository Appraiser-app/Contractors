import { adminDb } from "@/lib/firebase-admin";

// --- Helpers ---
function docToObj<T>(doc: FirebaseFirestore.DocumentSnapshot): T {
  return { id: doc.id, ...doc.data() } as T;
}

function snap<T>(snapshot: FirebaseFirestore.QuerySnapshot): T[] {
  return snapshot.docs.map(doc => docToObj<T>(doc));
}

// --- Profiles ---
export async function getProfileById(id: string) {
  const doc = await adminDb.collection("profiles").doc(id).get();
  if (!doc.exists) return null;
  return docToObj<Profile>(doc);
}

export async function getAllProfiles() {
  const snapshot = await adminDb.collection("profiles").orderBy("createdAt", "asc").get();
  return snap<Profile>(snapshot);
}

export async function createProfile(profile: { id: string; email: string; name: string; role: UserRole }) {
  const now = new Date().toISOString();
  const data = { ...profile, googleRefreshToken: null, createdAt: now, updatedAt: now };
  await adminDb.collection("profiles").doc(profile.id).set(data);
  return data as Profile;
}

export async function updateProfileRole(id: string, role: UserRole) {
  await adminDb.collection("profiles").doc(id).update({ role, updatedAt: new Date().toISOString() });
}

export async function updateProfilePermissions(id: string, permissions: UserPermissions) {
  await adminDb.collection("profiles").doc(id).update({ permissions, updatedAt: new Date().toISOString() });
}

export async function updateProfileActive(id: string, isActive: boolean) {
  await adminDb.collection("profiles").doc(id).update({ isActive, updatedAt: new Date().toISOString() });
}

export async function updateProfileName(id: string, name: string) {
  await adminDb.collection("profiles").doc(id).update({ name, updatedAt: new Date().toISOString() });
}

export async function getSuperAdmin() {
  const snapshot = await adminDb.collection("profiles").where("isSuperAdmin", "==", true).limit(1).get();
  return snapshot.empty ? null : docToObj<Profile>(snapshot.docs[0]);
}

export async function setSuperAdmin(id: string) {
  // Clear any existing super admin first
  const existing = await adminDb.collection("profiles").where("isSuperAdmin", "==", true).get();
  const batch = adminDb.batch();
  existing.docs.forEach(doc => batch.update(doc.ref, { isSuperAdmin: false }));
  batch.update(adminDb.collection("profiles").doc(id), { isSuperAdmin: true, role: "ADMIN", updatedAt: new Date().toISOString() });
  await batch.commit();
}

export async function saveGoogleRefreshToken(id: string, token: string) {
  await adminDb.collection("profiles").doc(id).update({ googleRefreshToken: token, updatedAt: new Date().toISOString() });
}

export async function clearGoogleRefreshToken(id: string) {
  await adminDb.collection("profiles").doc(id).update({ googleRefreshToken: null, updatedAt: new Date().toISOString() });
}

export async function deleteProfile(id: string) {
  await adminDb.collection("profiles").doc(id).delete();
}

export async function countAdmins() {
  const snapshot = await adminDb.collection("profiles").where("role", "==", "ADMIN").get();
  return snapshot.size;
}

// --- Work Sites ---
export async function getAllSites() {
  const [sitesSnap, txSnap] = await Promise.all([
    adminDb.collection("sites").orderBy("createdAt", "desc").get(),
    adminDb.collection("transactions").get(),
  ]);
  const transactions = snap<Transaction>(txSnap).filter(t => !t.archiveId);
  return sitesSnap.docs.map(doc => {
    const site = docToObj<WorkSite>(doc);
    site.transactions = transactions.filter(t => t.workSiteId === site.id);
    return site;
  });
}

export async function getSiteById(id: string) {
  const [doc, txSnap] = await Promise.all([
    adminDb.collection("sites").doc(id).get(),
    adminDb.collection("transactions").where("workSiteId", "==", id).get(),
  ]);
  if (!doc.exists) return null;
  const site = docToObj<WorkSite>(doc);
  site.transactions = snap<Transaction>(txSnap).filter(t => !t.archiveId);
  return site;
}

export async function createSite(siteData: Partial<WorkSite>) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const data = { ...siteData, id, createdAt: now, updatedAt: now };
  await adminDb.collection("sites").doc(id).set(data);
  return data as WorkSite;
}

export async function updateSite(id: string, siteData: Partial<WorkSite>) {
  const updates = { ...siteData, updatedAt: new Date().toISOString() };
  await adminDb.collection("sites").doc(id).update(updates);
  const doc = await adminDb.collection("sites").doc(id).get();
  return docToObj<WorkSite>(doc);
}

export async function deleteSite(id: string) {
  const txSnap = await adminDb.collection("transactions").where("workSiteId", "==", id).get();
  const batch = adminDb.batch();
  txSnap.docs.forEach(doc => batch.delete(doc.ref));
  batch.delete(adminDb.collection("sites").doc(id));
  await batch.commit();
}

// --- Transactions ---
export async function getAllTransactions() {
  const [txSnap, sitesSnap] = await Promise.all([
    adminDb.collection("transactions").orderBy("date", "desc").get(),
    adminDb.collection("sites").get(),
  ]);
  const siteMap: Record<string, { id: string; name: string }> = {};
  sitesSnap.docs.forEach(doc => { siteMap[doc.id] = { id: doc.id, name: doc.data().name }; });
  return snap<Transaction>(txSnap).filter(t => !t.archiveId).map(t => ({ ...t, workSite: siteMap[t.workSiteId] }));
}

export async function getTransactionsByArchive(archiveId: string) {
  const [txSnap, sitesSnap] = await Promise.all([
    adminDb.collection("transactions").where("archiveId", "==", archiveId).orderBy("date", "desc").get(),
    adminDb.collection("sites").get(),
  ]);
  const siteMap: Record<string, { id: string; name: string }> = {};
  sitesSnap.docs.forEach(doc => { siteMap[doc.id] = { id: doc.id, name: doc.data().name }; });
  return snap<Transaction>(txSnap).map(t => ({ ...t, workSite: siteMap[t.workSiteId] }));
}

export async function createTransaction(txData: Partial<Transaction> & { workSiteId: string }) {
  const id = txData.id || crypto.randomUUID();
  const now = new Date().toISOString();
  const data = { ...txData, id, archiveId: null, approvalStatus: txData.approvalStatus || "PENDING", createdAt: now, updatedAt: now };
  await adminDb.collection("transactions").doc(id).set(data);
  return data as Transaction;
}

export async function getTransactionById(id: string): Promise<Transaction | null> {
  const doc = await adminDb.collection("transactions").doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as Transaction;
}

export async function deleteTransaction(id: string) {
  await adminDb.collection("transactions").doc(id).delete();
}

export async function approveTransaction(id: string, approverId: string) {
  await adminDb.collection("transactions").doc(id).update({
    approvalStatus: "APPROVED",
    approvedById: approverId,
    approvedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

export async function rejectTransaction(id: string, approverId: string) {
  await adminDb.collection("transactions").doc(id).update({
    approvalStatus: "REJECTED",
    approvedById: approverId,
    approvedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

// --- Equipment ---
async function getEquipmentRelated(equipmentIds: string[]) {
  if (equipmentIds.length === 0) return { maintenance: [], insurances: [], expenses: [], documents: [], fuelLogs: [], serviceSchedules: [] };
  const [maintSnap, insSnap, expSnap, docSnap, fuelSnap, schedSnap, sitesSnap] = await Promise.all([
    adminDb.collection("maintenance").get(),
    adminDb.collection("insurances").get(),
    adminDb.collection("equipmentExpenses").get(),
    adminDb.collection("documents").get(),
    adminDb.collection("fuelLogs").get(),
    adminDb.collection("serviceSchedules").get(),
    adminDb.collection("workSites").get(),
  ]);
  const sitesMap: Record<string, { id: string; name: string; location: string | null }> = {};
  snap<WorkSite>(sitesSnap).forEach(s => { sitesMap[s.id] = { id: s.id, name: s.name, location: s.location }; });
  const fuelLogs = snap<FuelLog>(fuelSnap).filter(r => equipmentIds.includes(r.equipmentId)).map(r => ({
    ...r, workSite: r.workSiteId ? (sitesMap[r.workSiteId] || null) : null,
  }));
  return {
    maintenance: snap<MaintenanceRecord>(maintSnap).filter(r => equipmentIds.includes(r.equipmentId)),
    insurances: snap<Insurance>(insSnap).filter(r => equipmentIds.includes(r.equipmentId)),
    expenses: snap<EquipmentExpense>(expSnap).filter(r => equipmentIds.includes(r.equipmentId)),
    documents: snap<Document>(docSnap).filter(r => r.equipmentId != null && equipmentIds.includes(r.equipmentId!)),
    fuelLogs,
    serviceSchedules: snap<ServiceSchedule>(schedSnap).filter(r => equipmentIds.includes(r.equipmentId)),
  };
}

export async function getAllEquipment() {
  const eqSnap = await adminDb.collection("equipment").orderBy("createdAt", "desc").get();
  const equipment = snap<Equipment>(eqSnap);
  if (equipment.length === 0) return equipment;
  const ids = equipment.map(e => e.id);
  const related = await getEquipmentRelated(ids);
  return equipment.map(eq => ({
    ...eq,
    maintenance: related.maintenance.filter(r => r.equipmentId === eq.id),
    insurances: related.insurances.filter(r => r.equipmentId === eq.id),
    expenses: related.expenses.filter(r => r.equipmentId === eq.id),
    documents: related.documents.filter(r => r.equipmentId === eq.id),
    fuelLogs: related.fuelLogs.filter(r => r.equipmentId === eq.id),
    serviceSchedules: related.serviceSchedules.filter(r => r.equipmentId === eq.id),
  }));
}

export async function getEquipmentById(id: string) {
  const doc = await adminDb.collection("equipment").doc(id).get();
  if (!doc.exists) return null;
  const eq = docToObj<Equipment>(doc);
  const related = await getEquipmentRelated([id]);
  return {
    ...eq,
    maintenance: related.maintenance,
    insurances: related.insurances,
    expenses: related.expenses,
    documents: related.documents,
    fuelLogs: related.fuelLogs,
    serviceSchedules: related.serviceSchedules,
  };
}

export async function createEquipment(eqData: Partial<Equipment>) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const data = { ...eqData, id, createdAt: now, updatedAt: now };
  await adminDb.collection("equipment").doc(id).set(data);
  return data as Equipment;
}

export async function updateEquipment(id: string, eqData: Partial<Equipment>) {
  await adminDb.collection("equipment").doc(id).update({ ...eqData, updatedAt: new Date().toISOString() });
  const doc = await adminDb.collection("equipment").doc(id).get();
  return docToObj<Equipment>(doc);
}

export async function deleteEquipment(id: string) {
  const [maintSnap, insSnap, expSnap, docSnap, fuelSnap, schedSnap] = await Promise.all([
    adminDb.collection("maintenance").where("equipmentId", "==", id).get(),
    adminDb.collection("insurances").where("equipmentId", "==", id).get(),
    adminDb.collection("equipmentExpenses").where("equipmentId", "==", id).get(),
    adminDb.collection("documents").where("equipmentId", "==", id).get(),
    adminDb.collection("fuelLogs").where("equipmentId", "==", id).get(),
    adminDb.collection("serviceSchedules").where("equipmentId", "==", id).get(),
  ]);
  const batch = adminDb.batch();
  [...maintSnap.docs, ...insSnap.docs, ...expSnap.docs, ...docSnap.docs, ...fuelSnap.docs, ...schedSnap.docs].forEach(doc => batch.delete(doc.ref));
  batch.delete(adminDb.collection("equipment").doc(id));
  await batch.commit();
}

// --- Maintenance ---
export async function createMaintenance(data: Partial<MaintenanceRecord> & { equipmentId: string }) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const rec = { ...data, id, createdAt: now, updatedAt: now };
  await adminDb.collection("maintenance").doc(id).set(rec);
  return rec as MaintenanceRecord;
}

export async function deleteMaintenance(id: string) {
  await adminDb.collection("maintenance").doc(id).delete();
}

// --- Insurance ---
export async function createInsurance(data: Partial<Insurance> & { equipmentId: string }) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const rec = { ...data, id, createdAt: now, updatedAt: now };
  await adminDb.collection("insurances").doc(id).set(rec);
  return rec as Insurance;
}

export async function updateInsurance(id: string, data: Partial<Insurance>) {
  await adminDb.collection("insurances").doc(id).update({ ...data, updatedAt: new Date().toISOString() });
}

export async function deleteInsurance(id: string) {
  await adminDb.collection("insurances").doc(id).delete();
}

// --- Fuel Logs ---
export async function createFuelLog(data: Partial<FuelLog> & { equipmentId: string }) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const rec = { ...data, id, createdAt: now, updatedAt: now };
  await adminDb.collection("fuelLogs").doc(id).set(rec);
  return rec as FuelLog;
}

export async function deleteFuelLog(id: string) {
  await adminDb.collection("fuelLogs").doc(id).delete();
}

// --- Service Schedules ---
export async function createServiceSchedule(data: Partial<ServiceSchedule> & { equipmentId: string }) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const rec = { ...data, id, createdAt: now, updatedAt: now };
  await adminDb.collection("serviceSchedules").doc(id).set(rec);
  return rec as ServiceSchedule;
}

export async function deleteServiceSchedule(id: string) {
  await adminDb.collection("serviceSchedules").doc(id).delete();
}

// --- Equipment Expenses ---
export async function createEquipmentExpense(data: Partial<EquipmentExpense> & { equipmentId: string }) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const rec = { ...data, id, createdAt: now, updatedAt: now };
  await adminDb.collection("equipmentExpenses").doc(id).set(rec);
  return rec as EquipmentExpense;
}

export async function deleteEquipmentExpense(id: string) {
  await adminDb.collection("equipmentExpenses").doc(id).delete();
}

// --- Documents ---
export async function getAllDocuments() {
  const [docSnap, eqSnap] = await Promise.all([
    adminDb.collection("documents").orderBy("createdAt", "desc").get(),
    adminDb.collection("equipment").get(),
  ]);
  const eqMap: Record<string, { id: string; name: string; type: string }> = {};
  eqSnap.docs.forEach(doc => { eqMap[doc.id] = { id: doc.id, name: doc.data().name, type: doc.data().type }; });
  return snap<Document>(docSnap).map(d => ({ ...d, equipment: d.equipmentId ? eqMap[d.equipmentId] : null }));
}

export async function getExpiringDocuments(days = 30) {
  const future = new Date();
  future.setDate(future.getDate() + days);
  const snapshot = await adminDb.collection("documents").get();
  return snap<Document>(snapshot).filter(d => d.expiryDate && new Date(d.expiryDate) <= future);
}

export async function createDocument(doc: Partial<Document>) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const data = { ...doc, id, createdAt: now, updatedAt: now };
  await adminDb.collection("documents").doc(id).set(data);
  return data as Document;
}

export async function deleteDocument(id: string) {
  await adminDb.collection("documents").doc(id).delete();
}

// --- WhatsApp Messages ---
export async function getAllWhatsAppMessages() {
  const snapshot = await adminDb.collection("whatsappMessages").orderBy("createdAt", "desc").get();
  return snap<WhatsAppMessage>(snapshot);
}

export async function saveWhatsAppMessage(msg: Omit<WhatsAppMessage, "id" | "createdAt">) {
  const id = crypto.randomUUID();
  const data = { ...msg, id, createdAt: new Date().toISOString() };
  await adminDb.collection("whatsappMessages").doc(id).set(data);
  return data as WhatsAppMessage;
}

// --- Tasks ---
export async function getAllTasks() {
  const snapshot = await adminDb.collection("tasks").orderBy("createdAt", "desc").get();
  return snap<Task>(snapshot);
}

export async function getTasksBySite(siteId: string) {
  const snapshot = await adminDb.collection("tasks").where("siteId", "==", siteId).orderBy("createdAt", "asc").get();
  return snap<Task>(snapshot);
}

export async function createTask(task: Partial<Task>) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const data = { ...task, id, createdAt: now, updatedAt: now };
  await adminDb.collection("tasks").doc(id).set(data);
  return data as Task;
}

export async function updateTask(id: string, updates: Partial<Task>) {
  await adminDb.collection("tasks").doc(id).update({ ...updates, updatedAt: new Date().toISOString() });
}

export async function deleteTask(id: string) {
  await adminDb.collection("tasks").doc(id).delete();
}

// --- Notifications ---
export async function getNotificationsForUser(userId: string) {
  const snapshot = await adminDb.collection("notifications").where("userId", "==", userId).get();
  return snap<Notification>(snapshot).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 50);
}

export async function getUnreadCount(userId: string) {
  const snapshot = await adminDb.collection("notifications").where("userId", "==", userId).where("isRead", "==", false).get();
  return snapshot.size;
}

export async function createNotification(notif: Omit<Notification, "id" | "createdAt" | "isRead">) {
  const id = crypto.randomUUID();
  const data = { ...notif, id, isRead: false, createdAt: new Date().toISOString() };
  await adminDb.collection("notifications").doc(id).set(data);
}

export async function markNotificationRead(id: string) {
  await adminDb.collection("notifications").doc(id).update({ isRead: true });
}

export async function markAllNotificationsRead(userId: string) {
  const snapshot = await adminDb.collection("notifications").where("userId", "==", userId).where("isRead", "==", false).get();
  const batch = adminDb.batch();
  snapshot.docs.forEach(doc => batch.update(doc.ref, { isRead: true }));
  await batch.commit();
}

// --- Types ---
export type UserRole = "ADMIN" | "MANAGER" | "SECRETARY";

export type UserPermissions = {
  sites: boolean;
  expenses: boolean;
  transactions: boolean;
  approveTransactions: boolean;
  equipment: boolean;
  fuel: boolean;
  reports: boolean;
  documents: boolean;
  collection: boolean;
  subscriptions: boolean;
  canDelete: boolean;
};

export const DEFAULT_PERMISSIONS: Record<UserRole, UserPermissions> = {
  ADMIN: {
    sites: true, expenses: true, transactions: true, approveTransactions: true,
    equipment: true, fuel: true, reports: true, documents: true,
    collection: true, subscriptions: true, canDelete: true,
  },
  MANAGER: {
    sites: true, expenses: true, transactions: true, approveTransactions: true,
    equipment: true, fuel: true, reports: true, documents: true,
    collection: true, subscriptions: true, canDelete: true,
  },
  SECRETARY: {
    sites: true, expenses: true, transactions: true, approveTransactions: false,
    equipment: true, fuel: true, reports: false, documents: true,
    collection: false, subscriptions: false, canDelete: false,
  },
};

export type Profile = {
  id: string; email: string; name: string; role: UserRole;
  isSuperAdmin: boolean | null;
  isActive: boolean | null;
  permissions?: UserPermissions | null;
  googleRefreshToken: string | null;
  createdAt: string; updatedAt: string;
};

export type WorkSite = {
  id: string; name: string; location: string | null; description: string | null;
  clientName: string | null; clientPhone: string | null; contractValue: number | null;
  status: "ACTIVE" | "COMPLETED" | "ON_HOLD";
  startDate: string | null; endDate: string | null;
  workOrderUrl: string | null;
  orderNumber: string | null;
  completedAt: string | null;
  collectedAt: string | null;
  lat: number | null;
  lng: number | null;
  createdAt: string; updatedAt: string;
  transactions?: Transaction[];
};

export type InvoiceStatus = "NOT_ISSUED" | "ISSUED" | "SENT" | "PAID";

export type Transaction = {
  id: string; workSiteId: string; type: "INCOME" | "EXPENSE";
  amount: number; description: string; category: string | null; date: string;
  receiptUrl: string | null;
  invoiceStatus: InvoiceStatus | null;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  createdById: string | null;
  approvedById: string | null;
  approvedAt: string | null;
  archiveId: string | null;
  createdAt: string; updatedAt: string; workSite?: Partial<WorkSite>;
};

export type Equipment = {
  id: string; name: string; type: "TRUCK" | "MINI_EXCAVATOR" | "BOBCAT" | "OTHER";
  licensePlate: string | null; year: number | null; description: string | null;
  status: "ACTIVE" | "IN_REPAIR" | "INACTIVE";
  registeredOwner: string | null;
  registeredAt: "VEHICLE_LICENSING" | "LABOR_MINISTRY" | null;
  currentMileage: number | null;
  nextServiceMileage: number | null;
  testLastDate: string | null;
  testDate: string | null;
  testCost: number | null;
  createdAt: string; updatedAt: string;
  maintenance?: MaintenanceRecord[];
  insurances?: Insurance[];
  expenses?: EquipmentExpense[];
  documents?: Document[];
  fuelLogs?: FuelLog[];
  serviceSchedules?: ServiceSchedule[];
};

export type MaintenanceRecord = {
  id: string; equipmentId: string; description: string;
  cost: number | null; date: string; mileage: number | null; notes: string | null;
  createdAt: string; updatedAt: string;
};

export type Insurance = {
  id: string; equipmentId: string; type: string;
  company: string | null; policyNumber: string | null;
  startDate: string; endDate: string; cost: number | null; isPaid: boolean;
  createdAt: string; updatedAt: string;
};

export type EquipmentExpense = {
  id: string; equipmentId: string; category: string;
  amount: number; description: string; date: string;
  receiptUrl: string | null;
  workSiteId: string | null;
  createdAt: string; updatedAt: string;
};

export type FuelLog = {
  id: string; equipmentId: string;
  date: string; liters: number; pricePerLiter: number; totalCost: number;
  workSiteId: string | null; mileage: number | null; notes: string | null;
  createdAt: string; updatedAt: string;
  workSite?: { id: string; name: string; location?: string | null } | null;
};

export type ServiceSchedule = {
  id: string; equipmentId: string;
  name: string; intervalHours: number | null; intervalKm: number | null;
  notes: string | null;
  createdAt: string; updatedAt: string;
};

export type Document = {
  id: string; title: string;
  type: "LICENSE" | "INSURANCE" | "MANDATORY_INSURANCE" | "COMPREHENSIVE_INSURANCE" | "ITURAN" | "OWNERSHIP_TRANSFER" | "PERMIT" | "CONTRACT" | "RECEIPT" | "OTHER";
  fileUrl: string | null; expiryDate: string | null; notes: string | null;
  equipmentId: string | null;
  createdAt: string; updatedAt: string;
  equipment?: Partial<Equipment> | null;
};

export type WhatsAppMessage = {
  id: string; to: string; toName: string | null;
  body: string; status: string; siteId: string | null; sentBy: string | null;
  createdAt: string;
};

export type Task = {
  id: string; title: string; description: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate: string | null; assignedTo: string | null;
  siteId: string | null; createdBy: string | null;
  createdAt: string; updatedAt: string;
};

export type Notification = {
  id: string; userId: string; type: string;
  title: string; body: string; relatedId: string | null;
  isRead: boolean; createdAt: string;
};

export type ExpenseEntity = "דור" | "שגיא" | "חברה של שגיא" | "חברה של דור";

export type PaymentMethod = "מזומן" | "העברה בנקאית" | "כרטיס אשראי" | "צ'ק";

export type Expense = {
  id: string;
  entity: ExpenseEntity;
  amount: number;
  description: string;
  category: string | null;
  paymentMethod: PaymentMethod | null;
  vatIncluded: boolean | null;
  expenseType: "CASH" | "INVOICE" | null;
  invoiceUrl: string | null;
  invoiceFileName: string | null;
  date: string;
  receiptUrl: string | null;
  receiptFileName: string | null;
  notes: string | null;
  createdById: string | null;
  archiveId: string | null;
  createdAt: string;
};

export type ExpenseArchive = {
  id: string;
  name: string;
  notes: string | null;
  totalAmount: number;
  expenseCount: number;
  totalIncome: number;
  transactionCount: number;
  createdAt: string;
};

export type Invitation = {
  id: string; email: string; name: string;
  role: "ADMIN" | "SECRETARY";
  status: "PENDING" | "ACCEPTED";
  invitedById: string;
  createdAt: string; acceptedAt: string | null;
};

export type SubscriptionType = "ביטוח" | "איתוראן" | "מנוי תוכנה" | "רישיון" | "אחר";
export type BillingCycle = "חודשי" | "רבעוני" | "חצי שנתי" | "שנתי";

export type Subscription = {
  id: string;
  name: string;
  type: SubscriptionType;
  provider: string | null;
  amount: number;
  billingCycle: BillingCycle;
  startDate: string | null;
  nextRenewal: string;
  notes: string | null;
  isActive: boolean;
  equipmentId: string | null;
  equipmentName: string | null;
  createdAt: string; updatedAt: string;
};

export type MaintenanceAppointment = {
  id: string;
  equipmentId: string;
  equipmentName: string;
  description: string;
  scheduledDate: string;
  estimatedCost: number | null;
  status: "PENDING" | "DONE" | "CANCELLED";
  notes: string | null;
  createdAt: string; updatedAt: string;
};

// --- Subscriptions ---
export async function getAllSubscriptions() {
  const snap1 = await adminDb.collection("subscriptions").orderBy("nextRenewal", "asc").get();
  return snap<Subscription>(snap1);
}

export async function createSubscription(data: Omit<Subscription, "id" | "createdAt" | "updatedAt">) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const rec = { ...data, id, createdAt: now, updatedAt: now };
  await adminDb.collection("subscriptions").doc(id).set(rec);
  return rec as Subscription;
}

export async function updateSubscription(id: string, data: Partial<Subscription>) {
  await adminDb.collection("subscriptions").doc(id).update({ ...data, updatedAt: new Date().toISOString() });
}

export async function deleteSubscription(id: string) {
  await adminDb.collection("subscriptions").doc(id).delete();
}

// --- Maintenance Appointments ---
export async function getAllMaintenanceAppointments() {
  const snap1 = await adminDb.collection("maintenanceAppointments").orderBy("scheduledDate", "asc").get();
  return snap<MaintenanceAppointment>(snap1);
}

export async function createMaintenanceAppointment(data: Omit<MaintenanceAppointment, "id" | "createdAt" | "updatedAt">) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const rec = { ...data, id, createdAt: now, updatedAt: now };
  await adminDb.collection("maintenanceAppointments").doc(id).set(rec);
  return rec as MaintenanceAppointment;
}

export async function updateMaintenanceAppointment(id: string, data: Partial<MaintenanceAppointment>) {
  await adminDb.collection("maintenanceAppointments").doc(id).update({ ...data, updatedAt: new Date().toISOString() });
}

export async function deleteMaintenanceAppointment(id: string) {
  await adminDb.collection("maintenanceAppointments").doc(id).delete();
}

// --- Expenses ---
export async function getAllExpenses() {
  const snapshot = await adminDb.collection("expenses").orderBy("date", "desc").get();
  const all = snap<Expense>(snapshot);
  // Show only current (non-archived) expenses
  return all.filter(e => !e.archiveId);
}

export async function createExpense(data: Omit<Expense, "id" | "createdAt">) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const rec = { ...data, id, archiveId: null, createdAt: now };
  await adminDb.collection("expenses").doc(id).set(rec);
  return rec as Expense;
}

export async function deleteExpense(id: string) {
  await adminDb.collection("expenses").doc(id).delete();
}

// --- Expense Archives ---
export async function getAllExpenseArchives() {
  const snapshot = await adminDb.collection("expenseArchives").orderBy("createdAt", "desc").get();
  return snap<ExpenseArchive>(snapshot);
}

export async function getExpensesByArchive(archiveId: string) {
  const snapshot = await adminDb.collection("expenses").where("archiveId", "==", archiveId).orderBy("date", "desc").get();
  return snap<Expense>(snapshot);
}

export async function archiveCurrentExpenses(name: string, notes: string | null) {
  // Get all current (non-archived) expenses and transactions
  const [expSnap, txSnap] = await Promise.all([
    adminDb.collection("expenses").orderBy("date", "desc").get(),
    adminDb.collection("transactions").orderBy("date", "desc").get(),
  ]);
  const currentExpenses = snap<Expense>(expSnap).filter(e => !e.archiveId);
  const currentTx = snap<Transaction>(txSnap).filter(t => !t.archiveId);

  if (currentExpenses.length === 0 && currentTx.length === 0) throw new Error("אין נתונים לארכיון");

  const archiveId = crypto.randomUUID();
  const now = new Date().toISOString();
  const totalAmount = currentExpenses.reduce((s, e) => s + e.amount, 0);
  const totalIncome = currentTx.filter(t => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);

  // Create archive record
  const archive: ExpenseArchive = {
    id: archiveId, name, notes,
    totalAmount, expenseCount: currentExpenses.length,
    totalIncome, transactionCount: currentTx.length,
    createdAt: now,
  };
  await adminDb.collection("expenseArchives").doc(archiveId).set(archive);

  const batchSize = 400;
  // Archive expenses
  for (let i = 0; i < currentExpenses.length; i += batchSize) {
    const batch = adminDb.batch();
    currentExpenses.slice(i, i + batchSize).forEach(e => {
      batch.update(adminDb.collection("expenses").doc(e.id), { archiveId });
    });
    await batch.commit();
  }
  // Archive transactions
  for (let i = 0; i < currentTx.length; i += batchSize) {
    const batch = adminDb.batch();
    currentTx.slice(i, i + batchSize).forEach(t => {
      batch.update(adminDb.collection("transactions").doc(t.id), { archiveId });
    });
    await batch.commit();
  }

  return archive;
}

// --- Invitations ---
export async function createInvitation(data: Omit<Invitation, "id" | "createdAt" | "acceptedAt" | "status">) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const inv = { ...data, id, status: "PENDING", createdAt: now, acceptedAt: null };
  await adminDb.collection("invitations").doc(id).set(inv);
  return inv as Invitation;
}

export async function getInvitations() {
  const snapshot = await adminDb.collection("invitations").orderBy("createdAt", "desc").get();
  return snap<Invitation>(snapshot);
}

export async function getInvitationByEmail(email: string) {
  const snapshot = await adminDb.collection("invitations").where("email", "==", email).limit(1).get();
  return snapshot.empty ? null : docToObj<Invitation>(snapshot.docs[0]);
}

export async function acceptInvitation(id: string) {
  await adminDb.collection("invitations").doc(id).update({ status: "ACCEPTED", acceptedAt: new Date().toISOString() });
}

export async function deleteInvitation(id: string) {
  await adminDb.collection("invitations").doc(id).delete();
}

// --- User Activity ---
export type UserActivity = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: string;
  resource: string;
  resourceId?: string | null;
  resourceName?: string | null;
  timestamp: string;
};

export async function logActivity(data: Omit<UserActivity, "id" | "timestamp">) {
  const id = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  await adminDb.collection("userActivities").doc(id).set({ ...data, id, timestamp });
}

export async function getRecentActivities(limit = 100): Promise<UserActivity[]> {
  const snapshot = await adminDb.collection("userActivities")
    .orderBy("timestamp", "desc")
    .limit(limit)
    .get();
  return snap<UserActivity>(snapshot);
}

export async function getUserActivities(userId: string, limit = 50): Promise<UserActivity[]> {
  const snapshot = await adminDb.collection("userActivities")
    .where("userId", "==", userId)
    .orderBy("timestamp", "desc")
    .limit(limit)
    .get();
  return snap<UserActivity>(snapshot);
}

// --- All Fuel Logs (cross-equipment) ---
export async function getAllFuelLogs(): Promise<FuelLog[]> {
  const [fuelSnap, equipSnap, sitesSnap] = await Promise.all([
    adminDb.collection("fuelLogs").orderBy("date", "desc").get(),
    adminDb.collection("equipment").get(),
    adminDb.collection("sites").get(),
  ]);

  const equipMap: Record<string, string> = {};
  equipSnap.docs.forEach(d => { equipMap[d.id] = d.data().name; });

  const sitesMap: Record<string, { id: string; name: string; location: string | null }> = {};
  sitesSnap.docs.forEach(d => { sitesMap[d.id] = { id: d.id, name: d.data().name, location: d.data().location || null }; });

  return snap<FuelLog>(fuelSnap).map(r => ({
    ...r,
    equipmentName: equipMap[r.equipmentId] || null,
    workSite: r.workSiteId ? (sitesMap[r.workSiteId] || null) : null,
  })) as (FuelLog & { equipmentName?: string | null })[];
}
