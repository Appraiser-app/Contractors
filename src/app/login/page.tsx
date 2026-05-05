"use client";

import { useState, useEffect } from "react";
import { signInWithEmailAndPassword, signInWithRedirect, signInWithPopup, getRedirectResult, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

type Mode = "login" | "signup";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();

  // Handle redirect result (mobile fallback)
  useEffect(() => {
    getRedirectResult(auth)
      .then(async (result) => {
        if (!result) return;
        setGoogleLoading(true);
        await finishGoogleLogin(result.user);
      })
      .catch((err: unknown) => {
        const code = (err as { code?: string })?.code || "";
        if (code && code !== "auth/no-auth-event") {
          setError(`שגיאה: ${code}`);
        }
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function switchMode(m: Mode) {
    setMode(m); setError(""); setSuccess(""); setPassword(""); setConfirmPassword("");
  }

  async function createSession(idToken: string) {
    const res = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(`שגיאת שרת: ${data.detail || data.error || res.status}`);
    }
    return res.ok;
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await cred.user.getIdToken();
      const ok = await createSession(idToken);
      if (ok) router.push("/dashboard");
      else setError("שגיאה בכניסה, נסה שוב");
    } catch {
      setError("אימייל או סיסמה שגויים");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) { setError("הסיסמאות אינן תואמות"); return; }
    if (password.length < 6) { setError("הסיסמה חייבת להכיל לפחות 6 תווים"); return; }
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "שגיאה בהרשמה");
      setLoading(false);
    } else {
      setSuccess("נרשמת בהצלחה! כעת תוכל להתחבר עם הפרטים שלך.");
      setLoading(false);
      setPassword(""); setConfirmPassword("");
      setTimeout(() => switchMode("login"), 2000);
    }
  }

  async function finishGoogleLogin(user: { getIdToken: () => Promise<string>; displayName: string | null; email: string | null }) {
    const idToken = await user.getIdToken();
    await fetch("/api/auth/google-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken, name: user.displayName || user.email, email: user.email }),
    });
    const ok = await createSession(idToken);
    if (ok) router.push("/dashboard");
    else setGoogleLoading(false);
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    setError("");
    const provider = new GoogleAuthProvider();
    try {
      // Try popup first (more reliable on desktop)
      const result = await signInWithPopup(auth, provider);
      await finishGoogleLogin(result.user);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || "";
      if (code === "auth/popup-blocked" || code === "auth/popup-cancelled-by-user") {
        // Popup blocked — fall back to redirect
        try {
          await signInWithRedirect(auth, provider);
        } catch {
          setError("שגיאה בהתחברות עם גוגל");
          setGoogleLoading(false);
        }
      } else if (code === "auth/operation-not-allowed") {
        setError("Google Login לא מופעל — יש להפעיל ב-Firebase Console");
        setGoogleLoading(false);
      } else if (code === "auth/unauthorized-domain") {
        setError("הדומיין לא מורשה ב-Firebase Console");
        setGoogleLoading(false);
      } else if (code === "auth/cancelled-popup-request") {
        setGoogleLoading(false); // user opened popup twice
      } else {
        setError(`שגיאה: ${code || "לא ידועה"}`);
        setGoogleLoading(false);
      }
    }
  }

  return (
    <div className="min-h-screen bg-stone-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-green-700 rounded-2xl mb-4 shadow-xl shadow-green-900/40">
            <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">ניהול קבלן עפר</h1>
          <p className="text-stone-400 text-sm mt-1">שגיא ודור</p>
        </div>

        <div className="flex bg-stone-800/60 rounded-2xl p-1 mb-4 border border-stone-700/50">
          {(["login", "signup"] as Mode[]).map(m => (
            <button key={m} onClick={() => switchMode(m)}
              className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all ${mode === m ? "bg-green-600 text-white shadow-md" : "text-stone-400 hover:text-white"}`}>
              {m === "login" ? "כניסה" : "הרשמה"}
            </button>
          ))}
        </div>

        <div className="bg-stone-800 rounded-2xl p-6 border border-stone-700 space-y-4">
          <button type="button" onClick={handleGoogleLogin} disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 disabled:bg-stone-600 disabled:cursor-not-allowed text-gray-800 font-semibold py-3 rounded-xl transition-colors">
            {googleLoading ? (
              <svg className="w-5 h-5 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            {googleLoading ? "מתחבר..." : mode === "login" ? "כניסה עם Google" : "הרשמה עם Google"}
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-stone-700" />
            <span className="text-stone-500 text-xs">או</span>
            <div className="flex-1 h-px bg-stone-700" />
          </div>

          {mode === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-300 mb-1.5">אימייל</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  className="w-full bg-stone-900 border border-stone-600 rounded-xl px-4 py-3 text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-green-600 transition"
                  placeholder="name@example.com" dir="ltr" />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-300 mb-1.5">סיסמה</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                  className="w-full bg-stone-900 border border-stone-600 rounded-xl px-4 py-3 text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-green-600 transition"
                  placeholder="••••••••" />
              </div>
              {error && <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm text-center">{error}</div>}
              <button type="submit" disabled={loading || googleLoading}
                className="w-full bg-green-600 hover:bg-green-500 disabled:bg-stone-600 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors">
                {loading ? "מתחבר..." : "כניסה"}
              </button>
            </form>
          )}

          {mode === "signup" && (
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-300 mb-1.5">שם מלא</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required
                  className="w-full bg-stone-900 border border-stone-600 rounded-xl px-4 py-3 text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-green-600 transition"
                  placeholder="ישראל ישראלי" />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-300 mb-1.5">אימייל</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  className="w-full bg-stone-900 border border-stone-600 rounded-xl px-4 py-3 text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-green-600 transition"
                  placeholder="name@example.com" dir="ltr" />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-300 mb-1.5">סיסמה</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
                  className="w-full bg-stone-900 border border-stone-600 rounded-xl px-4 py-3 text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-green-600 transition"
                  placeholder="לפחות 6 תווים" />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-300 mb-1.5">אימות סיסמה</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required
                  className={`w-full bg-stone-900 border rounded-xl px-4 py-3 text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-green-600 transition ${confirmPassword && password !== confirmPassword ? "border-red-500" : "border-stone-600"}`}
                  placeholder="••••••••" />
              </div>
              {error && <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm text-center">{error}</div>}
              {success && <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 text-green-400 text-sm text-center">{success}</div>}
              <button type="submit" disabled={loading || googleLoading || (!!confirmPassword && password !== confirmPassword)}
                className="w-full bg-green-600 hover:bg-green-500 disabled:bg-stone-600 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors">
                {loading ? "נרשם..." : "צור חשבון"}
              </button>
              <p className="text-stone-500 text-xs text-center">החשבון ייפתח עם הרשאות בסיסיות — מנהל המערכת יכול לשדרג הרשאות</p>
            </form>
          )}
        </div>
        <p className="text-center text-stone-600 text-xs mt-6">גישה לאנשי הצוות בלבד</p>
      </div>
    </div>
  );
}
