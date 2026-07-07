"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteTransactionButton({
	transactionId,
}: { transactionId: string }) {
	const [confirm, setConfirm] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const router = useRouter();

	async function handleDelete() {
		setLoading(true);
		setError("");
		try {
			const res = await fetch(`/api/transactions/${transactionId}`, {
				method: "DELETE",
			});
			if (res.ok) {
				router.refresh();
			} else {
				const data = await res.json().catch(() => ({}));
				setError(data.error || `שגיאה ${res.status}`);
				setLoading(false);
			}
		} catch {
			setError("שגיאת רשת");
			setLoading(false);
		}
	}

	if (confirm) {
		return (
			<div className="flex flex-col items-end gap-1">
				<div className="flex items-center gap-1.5">
					<button
						type="button"
						onClick={handleDelete}
						disabled={loading}
						className="text-xs bg-red-500 hover:bg-red-400 text-white font-semibold px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-60"
					>
						{loading ? "מוחק..." : "מחק"}
					</button>
					<button
						type="button"
						onClick={() => {
							setConfirm(false);
							setError("");
						}}
						className="text-xs border border-gray-200 text-gray-500 px-2.5 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
					>
						ביטול
					</button>
				</div>
				{error && <p className="text-xs text-red-500">{error}</p>}
			</div>
		);
	}

	return (
		<button
			type="button"
			onClick={() => setConfirm(true)}
			className="text-gray-300 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-50"
			title="מחק תנועה"
		>
			<svg
				aria-hidden="true"
				className="w-4 h-4"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={2}
					d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
				/>
			</svg>
		</button>
	);
}
