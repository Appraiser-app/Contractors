import { requireAuth } from "@/lib/auth";
import { getAllExpenses } from "@/lib/db";
import ExpensesClient from "./ExpensesClient";

export default async function ExpensesPage() {
  await requireAuth();
  const expenses = await getAllExpenses();
  return <ExpensesClient initialExpenses={expenses} />;
}
