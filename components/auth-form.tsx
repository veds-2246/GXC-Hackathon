"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { BrandLockup } from "@/components/brand-lockup";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type AuthFormProps = { mode: "login" | "signup"; nextPath?: string };

export function AuthForm({ mode, nextPath = "/register" }: AuthFormProps) {
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
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/register`,
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

    router.replace(isSignup ? "/register" : nextPath);
    router.refresh();
  }

  async function handleGoogle() {
    setBusy("google");
    setError("");
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(isSignup ? "/register" : nextPath)}` },
    });
    if (oauthError) {
      setBusy(null);
      setError(oauthError.message);
    }
  }

  return (
    <div className="surface-glass-panel card-hover w-full max-w-md rounded-[2rem] p-7 sm:p-9">
      <div className="mb-8">
        <BrandLockup className="mb-6" />
        <h1 className="editorial text-5xl leading-none">{isSignup ? "Your next chapter." : "Welcome back."}</h1>
        <p className="mt-3 text-sm leading-6 text-[#76678a]">
          {isSignup ? "Create your account to get started with the event." : "Sign in to continue to your event dashboard."}
        </p>
      </div>

      <button type="button" onClick={handleGoogle} disabled={busy !== null} className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#eadff5] bg-white px-4 py-3 text-sm font-semibold transition hover:bg-[#f7f9fc] disabled:opacity-60">
        <svg aria-hidden="true" viewBox="0 0 48 48" className="size-5"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.42 37.98 46.98 31.92 46.98 24.55Z"/><path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.53 2.56 10.78l7.97-6.19Z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.14 1.44-4.89 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"/></svg>
        Continue with Google
      </button>

      <div className="my-6 flex items-center gap-4 text-[10px] font-semibold tracking-[.15em] text-[#a18db8]"><span className="h-px flex-1 bg-[#eadff5]"/><span>OR WITH EMAIL</span><span className="h-px flex-1 bg-[#eadff5]"/></div>

      <form onSubmit={handleEmail} className="space-y-4">
        {isSignup && <label className="block text-xs font-semibold text-[#57436d]">Full name<input required autoComplete="name" value={fullName} onChange={e => setFullName(e.target.value)} className="mt-2 w-full rounded-xl border border-[#eadff5] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#5f2295] focus:ring-2 focus:ring-purple-100" placeholder="Your name"/></label>}
        <label className="block text-xs font-semibold text-[#57436d]">Email address<input required type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-2 w-full rounded-xl border border-[#eadff5] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#5f2295] focus:ring-2 focus:ring-purple-100" placeholder="you@example.com"/></label>
        <label className="block text-xs font-semibold text-[#57436d]">Password<input required type="password" minLength={6} autoComplete={isSignup ? "new-password" : "current-password"} value={password} onChange={e => setPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-[#eadff5] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#5f2295] focus:ring-2 focus:ring-purple-100" placeholder="At least 6 characters"/></label>
        {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {message && <p role="status" className="rounded-lg bg-green-50 px-3 py-2 text-sm leading-5 text-green-800">{message}</p>}
        <button type="submit" disabled={busy !== null} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#5f2295] px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-purple-900/15 transition hover:bg-[#4b1877] disabled:cursor-not-allowed disabled:opacity-60">
          {busy === "email" ? "Please wait…" : isSignup ? "Create account" : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[#76678a]">
        {isSignup ? "Already registered?" : "New to GenXCode?"}{" "}
        <Link className="font-semibold text-[#5f2295] hover:underline" href={isSignup ? "/login" : "/signup"}>{isSignup ? "Sign in" : "Create an account"}</Link>
      </p>
      <p className="mt-8 text-center text-xs text-[#a18db8]"><Link href="/" className="hover:text-[#5f2295]">Back to event website</Link></p>
    </div>
  );
}
