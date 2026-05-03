import { requireAuth } from "@/lib/auth";
import { getAllTransactions } from "@/lib/db";
import Link from "next/link";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 }).format(amount);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "short", year: "numeric" }).format(new Date(date));
}

export default async function TransactionsPage() {
  await requireAuth();
  const transactions = await getAllTransactions();

  const totalIncome = transactions.filter(t => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">הכנסות והוצאות</h1>
        <p className="text-gray-400 text-sm mt-1">{transactions.length} תנועות בסך הכל</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 11l5-5m0 0l5 5m-5-5v12" />
              </svg>
            </div>
            <p className="text-xs text-gray-400 font-medium">סה"כ הכנסות</p>
          </div>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 bg-red-100 rounded-lg flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
              </svg>
            </div>
            <p className="text-xs text-gray-400 font-medium">סה"כ הוצאות</p>
          </div>
          <p className="text-2xl font-bold text-red-500">{formatCurrency(totalExpense)}</p>
        </div>
        <div className={`rounded-2xl border p-5 hover:shadow-md transition-shadow ${balance >= 0 ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100"}`}>
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${balance >= 0 ? "bg-green-200" : "bg-red-200"}`}>
              <svg className={`w-3.5 h-3.5 ${balance >= 0 ? "text-green-700" : "text-red-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-xs text-gray-400 font-medium">יתרה</p>
          </div>
          <p className={`text-2xl font-bold ${balance >= 0 ? "text-green-700" : "text-red-700"}`}>{formatCurrency(balance)}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {transactions.length === 0 ? (
          <div className="p-16 text-center">
            <p className="text-5xl mb-4">💸</p>
            <p className="text-gray-400">אין תנועות עדיין</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/70">
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">תאריך</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">תיאור</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">אתר</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">קטגוריה</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">סכום</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {transactions.map(t => (
                <tr key={t.id} className="hover:bg-green-50/30 transition-colors">
                  <td className="px-5 py-4 text-sm text-gray-400 whitespace-nowrap">{formatDate(t.date)}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${t.type === "INCOME" ? "bg-green-100" : "bg-red-100"}`}>
                        <svg className={`w-3 h-3 ${t.type === "INCOME" ? "text-green-600" : "text-red-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={t.type === "INCOME" ? "M7 11l5-5m0 0l5 5m-5-5v12" : "M17 13l-5 5m0 0l-5-5m5 5V6"} />
                        </svg>
                      </div>
                      <div>
                        <span className="text-sm text-gray-800 font-medium">{t.description}</span>
                        {t.receiptUrl && (
                          <a href={t.receiptUrl} target="_blank" rel="noopener noreferrer"
                            className="mr-2 text-xs text-blue-400 hover:text-blue-600">📎</a>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <Link href={`/sites/${t.workSiteId}`} className="text-sm text-green-600 hover:text-green-700 font-medium hover:underline">{t.workSite?.name || ""}</Link>
                  </td>
                  <td className="px-5 py-4">
                    {t.category ? (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{t.category}</span>
                    ) : (
                      <span className="text-gray-300 text-sm">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-left">
                    <span className={`text-sm font-bold ${t.type === "INCOME" ? "text-green-600" : "text-red-500"}`}>
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
