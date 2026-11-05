"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type AuthFormProps = { mode: "login" | "signup" };

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState<"email" | "google" | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const isSignup = mode === "signup";

  async function handleEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("email");
    setError("");
    setMessage("");

    const result = isSignup
      ? await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName.trim() },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
          },
        })
      : await supabase.auth.signInWithPassword({ email, password });

    setBusy(null);
    if (result.error) {
      setError(result.error.message);
      return;
    }

    if (isSignup && !result.data.session) {
      setMessage("Account created. Check your email and confirm your address before signing in.");
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  async function handleGoogle() {
    setBusy("google");
    setError("");
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/dashboard` },
    });
    if (oauthError) {
      setBusy(null);
      setError(oauthError.message);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8">
        <p className="eyebrow mb-3">GENXCODE TECH FEST 2026</p>
        <h1 className="editorial text-5xl leading-none">{isSignup ? "Your next chapter." : "Welcome back."}</h1>
        <p className="mt-3 text-sm leading-6 text-[#697386]">
          {isSignup ? "Create your account to get started with the event." : "Sign in to continue to your event dashboard."}
        </p>
      </div>

      <button type="button" onClick={handleGoogle} disabled={busy !== null} className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#dfe3ea] bg-white px-4 py-3 text-sm font-semibold transition hover:bg-[#f7f9fc] disabled:opacity-60">
        <svg aria-hidden="true" viewBox="0 0 48 48" className="size-5"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.42 37.98 46.98 31.92 46.98 24.55Z"/><path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.53 2.56 10.78l7.97-6.19Z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.14 1.44-4.89 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"/></svg>
        Continue with Google
      </button>

      <div className="my-6 flex items-center gap-4 text-[10px] font-semibold tracking-[.15em] text-[#9aa1ad]"><span className="h-px flex-1 bg-[#e4e4dd]"/><span>OR WITH EMAIL</span><span className="h-px flex-1 bg-[#e4e4dd]"/></div>

      <form onSubmit={handleEmail} className="space-y-4">
        {isSignup && <label className="block text-xs font-semibold text-[#374151]">Full name<input required autoComplete="name" value={fullName} onChange={e => setFullName(e.target.value)} className="mt-2 w-full rounded-xl border border-[#dfe3ea] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#1a56db] focus:ring-2 focus:ring-blue-100" placeholder="Your name"/></label>}
        <label className="block text-xs font-semibold text-[#374151]">Email address<input required type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-2 w-full rounded-xl border border-[#dfe3ea] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#1a56db] focus:ring-2 focus:ring-blue-100" placeholder="you@example.com"/></label>
        <label className="block text-xs font-semibold text-[#374151]">Password<input required type="password" minLength={6} autoComplete={isSignup ? "new-password" : "current-password"} value={password} onChange={e => setPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-[#dfe3ea] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#1a56db] focus:ring-2 focus:ring-blue-100" placeholder="At least 6 characters"/></label>
        {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {message && <p role="status" className="rounded-lg bg-green-50 px-3 py-2 text-sm leading-5 text-green-800">{message}</p>}
        <button type="submit" disabled={busy !== null} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1a56db] px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-900/15 transition hover:bg-[#1649bd] disabled:cursor-not-allowed disabled:opacity-60">
          {busy === "email" ? "Please wait…" : isSignup ? "Create account" : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[#697386]">
        {isSignup ? "Already registered?" : "New to GenXCode?"}{" "}
        <Link className="font-semibold text-[#1a56db] hover:underline" href={isSignup ? "/login" : "/signup"}>{isSignup ? "Sign in" : "Create an account"}</Link>
      </p>
      <p className="mt-8 text-center text-xs text-[#9aa1ad]"><Link href="/" className="hover:text-[#1a56db]">← Back to event website</Link></p>
    </div>
  );
}
