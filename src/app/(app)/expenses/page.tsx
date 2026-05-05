import { requireAuth, getProfile } from "@/lib/auth";
import { getAllExpenses, getAllExpenseArchives } from "@/lib/db";
import ExpensesClient from "./ExpensesClient";

export default async function ExpensesPage() {
  await requireAuth();
  const profile = await getProfile();
  const [expenses, archives] = await Promise.all([getAllExpenses(), getAllExpenseArchives()]);
  const isAdmin = profile?.role === "ADMIN";
  return <ExpensesClient initialExpenses={expenses} initialArchives={archives} isAdmin={isAdmin} />;
}
