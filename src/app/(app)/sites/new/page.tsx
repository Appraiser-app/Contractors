import { requireAuth } from "@/lib/auth";
import SiteForm from "@/components/SiteForm";
import Link from "next/link";

export default async function NewSitePage() {
  await requireAuth();
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl">
      <div className="mb-5 sm:mb-8">
        <h1 className="text-2xl font-bold text-gray-900">אתר עבודה חדש</h1>
        <p className="text-gray-500 text-sm mt-1">הזן את פרטי האתר החדש</p>
      </div>

      {/* Upload work order shortcut */}
      <Link
        href="/work-orders/upload"
        className="flex items-center gap-4 bg-green-50 border border-green-200 rounded-2xl p-4 mb-5 hover:bg-green-100/60 transition-colors group"
      >
        <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md shadow-green-200">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="font-semibold text-green-800 text-sm">העלה הזמנת עבודה</p>
          <p className="text-green-600/70 text-xs mt-0.5">העלה PDF — הפרטים יתמלאו אוטומטית</p>
        </div>
        <svg className="w-5 h-5 text-green-400 group-hover:text-green-600 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Link>

      <div className="relative flex items-center gap-3 mb-5">
        <div className="flex-1 h-px bg-gray-100" />
        <span className="text-xs text-gray-400 font-medium">או הוסף ידנית</span>
        <div className="flex-1 h-px bg-gray-100" />
      </div>

      <SiteForm />
    </div>
  );
}
