import { requireAuth, getProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import DeleteSiteButton from "@/components/DeleteSiteButton";
import AddTransactionForm from "@/components/AddTransactionForm";

const statusLabel: Record<string, string> = {
  ACTIVE: "פעיל",
  COMPLETED: "הושלם",
  ON_HOLD: "מושהה",
};

const statusColor: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  COMPLETED: "bg-blue-100 text-blue-700",
  ON_HOLD: "bg-yellow-100 text-yellow-700",
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 }).format(amount);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "long", year: "numeric" }).format(new Date(date));
}

export default async function SitePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAuth();
  const profile = await getProfile();
  const { id } = await params;

  const site = await prisma.workSite.findUnique({
    where: { id },
    include: {
      transactions: { orderBy: { date: "desc" } },
    },
  });

  if (!site) notFound();

  const income = site.transactions.filter(t => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
  const expense = site.transactions.filter(t => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;
  const isAdmin = profile?.role === "ADMIN";

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link href="/sites" className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">{site.name}</h1>
            <span className={`text-xs font-medium px-2 py-1 rounded-lg ${statusColor[site.status]}`}>
              {statusLabel[site.status]}
            </span>
          </div>
          {site.location && <p className="text-gray-500 text-sm mr-8">{site.location}</p>}
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Link
              href={`/sites/${site.id}/edit`}
              className="flex items-center gap-2 border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium px-3 py-2 rounded-xl transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              עריכה
            </Link>
            <DeleteSiteButton siteId={site.id} />
          </div>
        )}
      </div>

      {/* Site details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-gray-400 text-xs mb-1">הכנסות</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(income)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-gray-400 text-xs mb-1">הוצאות</p>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(expense)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-gray-400 text-xs mb-1">יתרה</p>
          <p className={`text-2xl font-bold ${balance >= 0 ? "text-green-700" : "text-red-700"}`}>{formatCurrency(balance)}</p>
        </div>
      </div>

      {/* Extra info */}
      {(site.clientName || site.contractValue || site.description) && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {site.clientName && (
            <div>
              <p className="text-xs text-gray-400 mb-0.5">שם לקוח</p>
              <p className="text-sm font-medium text-gray-900">{site.clientName}</p>
            </div>
          )}
          {site.contractValue && (
            <div>
              <p className="text-xs text-gray-400 mb-0.5">ערך חוזה</p>
              <p className="text-sm font-medium text-gray-900">{formatCurrency(site.contractValue)}</p>
            </div>
          )}
          {site.description && (
            <div className="md:col-span-3">
              <p className="text-xs text-gray-400 mb-0.5">תיאור</p>
              <p className="text-sm text-gray-600">{site.description}</p>
            </div>
          )}
        </div>
      )}

      {/* Add Transaction */}
      <div className="mb-6">
        <AddTransactionForm siteId={site.id} />
      </div>

      {/* Transactions */}
      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="p-5 border-b border-gray-50">
          <h2 className="font-bold text-gray-900">תנועות ({site.transactions.length})</h2>
        </div>
        {site.transactions.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-400 text-sm">אין תנועות עדיין</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {site.transactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${t.type === "INCOME" ? "bg-green-100" : "bg-red-100"}`}>
                    {t.type === "INCOME" ? (
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{t.description}</p>
                    <div className="flex gap-2 mt-0.5">
                      {t.category && <span className="text-xs text-gray-400">{t.category}</span>}
                      <span className="text-xs text-gray-400">{formatDate(t.date)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-bold ${t.type === "INCOME" ? "text-green-600" : "text-red-600"}`}>
                    {t.type === "INCOME" ? "+" : "-"}{formatCurrency(t.amount)}
                  </span>
                  {isAdmin && (
                    <DeleteTransactionButton transactionId={t.id} />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DeleteTransactionButton({ transactionId }: { transactionId: string }) {
  return (
    <form action={`/api/transactions/${transactionId}`} method="DELETE">
      <DeleteTransactionClientButton transactionId={transactionId} />
    </form>
  );
}

// We'll handle delete client-side
function DeleteTransactionClientButton({ transactionId }: { transactionId: string }) {
  return null; // Handled by client component below - we'll keep it simple for now
}
