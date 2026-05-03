import { requireAuth, getProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 }).format(amount);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "short", year: "numeric" }).format(new Date(date));
}

export default async function TransactionsPage() {
  await requireAuth();

  const transactions = await prisma.transaction.findMany({
    orderBy: { date: "desc" },
    include: { workSite: true },
  });

  const totalIncome = transactions.filter(t => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">הכנסות והוצאות</h1>
        <p className="text-gray-500 text-sm mt-1">{transactions.length} תנועות בסך הכל</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-xs text-gray-400 mb-1">סה״כ הכנסות</p>
          <p className="text-xl font-bold text-green-600">{formatCurrency(totalIncome)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-xs text-gray-400 mb-1">סה״כ הוצאות</p>
          <p className="text-xl font-bold text-red-600">{formatCurrency(totalExpense)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-xs text-gray-400 mb-1">יתרה</p>
          <p className={`text-xl font-bold ${totalIncome - totalExpense >= 0 ? "text-green-700" : "text-red-700"}`}>
            {formatCurrency(totalIncome - totalExpense)}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {transactions.length === 0 ? (
          <div className="p-16 text-center">
            <p className="text-gray-400 text-sm">אין תנועות עדיין</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="text-right px-5 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">תאריך</th>
                <th className="text-right px-5 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">תיאור</th>
                <th className="text-right px-5 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">אתר</th>
                <th className="text-right px-5 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">קטגוריה</th>
                <th className="text-left px-5 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">סכום</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {transactions.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4 text-sm text-gray-500 whitespace-nowrap">{formatDate(t.date)}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${t.type === "INCOME" ? "bg-green-500" : "bg-red-500"}`} />
                      <span className="text-sm text-gray-900">{t.description}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <Link href={`/sites/${t.workSiteId}`} className="text-sm text-amber-600 hover:underline">
                      {t.workSite.name}
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-500">{t.category || "—"}</td>
                  <td className="px-5 py-4 text-left">
                    <span className={`text-sm font-bold ${t.type === "INCOME" ? "text-green-600" : "text-red-600"}`}>
                      {t.type === "INCOME" ? "+" : "-"}{formatCurrency(t.amount)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
