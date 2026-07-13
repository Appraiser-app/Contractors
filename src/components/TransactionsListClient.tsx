"use client";

import { useState } from "react";
import EditTransactionModal from "./EditTransactionModal";
import DeleteTransactionButton from "./DeleteTransactionButton";
import InvoiceStatusBadge from "./InvoiceStatusBadge";

type Transaction = {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  description: string;
  category: string | null;
  date: string;
  receiptUrl: string | null;
  invoiceStatus: string | null;
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("he-IL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export default function TransactionsListClient({
  transactions,
  isAdmin,
}: {
  transactions: Transaction[];
  isAdmin: boolean;
}) {
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const sorted = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <>
      {editingTx && (
        <EditTransactionModal
          transaction={editingTx}
          onClose={() => setEditingTx(null)}
        />
      )}

      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-50">
          <h2 className="font-bold text-gray-900">
            תנועות ({transactions.length})
          </h2>
        </div>
        {sorted.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <p className="text-gray-400 text-sm">אין תנועות עדיין</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {sorted.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 gap-2"
              >
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                      t.type === "INCOME" ? "bg-green-100" : "bg-red-100"
                    }`}
                  >
                    <svg
                      aria-hidden="true"
                      className={`w-4 h-4 ${
                        t.type === "INCOME" ? "text-green-600" : "text-red-600"
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d={
                          t.type === "INCOME"
                            ? "M7 11l5-5m0 0l5 5m-5-5v12"
                            : "M17 13l-5 5m0 0l-5-5m5 5V6"
                        }
                      />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {t.description}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-0.5">
                      {t.category && (
                        <span className="text-xs text-gray-400">{t.category}</span>
                      )}
                      <span className="text-xs text-gray-400">{formatDate(t.date)}</span>
                      {t.invoiceStatus && (
                        <InvoiceStatusBadge
                          status={t.invoiceStatus as "NOT_ISSUED" | "ISSUED" | "SENT" | "PAID"}
                          transactionId={t.id}
                        />
                      )}
                      {t.receiptUrl && (
                        <a
                          href={t.receiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-400 hover:text-blue-600"
                        >
                          📎 קבלה
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span
                    className={`text-sm font-bold ml-1 ${
                      t.type === "INCOME" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {t.type === "INCOME" ? "+" : "-"}
                    {formatCurrency(t.amount)}
                  </span>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setEditingTx(t)}
                      className="text-gray-300 hover:text-blue-400 transition-colors p-1 rounded-lg hover:bg-blue-50"
                      title="ערוך תנועה"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                  )}
                  <DeleteTransactionButton transactionId={t.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
