"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Expand,
  LoaderCircle,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  Ticket,
  X,
} from "lucide-react";
import Link from "next/link";

type DigitalPassProps = {
  fullName: string;
  applicationNumber: string;
};

type PassTokenResponse = {
  token?: string;
  expiresAt?: string;
  error?: string;
};

export function DigitalPass({ fullName, applicationNumber }: DigitalPassProps) {
  const [token, setToken] = useState("");
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fullScreen, setFullScreen] = useState(false);

  const refreshToken = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/digital-pass/token", {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
      });
      const result = (await response.json()) as PassTokenResponse;

      if (!response.ok || !result.token || !result.expiresAt) {
        throw new Error(result.error || "Unable to refresh your pass.");
      }

      setToken(result.token);
      setExpiresAt(new Date(result.expiresAt).getTime());
    } catch (refreshError) {
      setToken("");
      setExpiresAt(null);
      setError(
        refreshError instanceof Error
          ? refreshError.message
          : "Unable to refresh your pass. Check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshToken();
    const clock = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(clock);
  }, [refreshToken]);

  useEffect(() => {
    if (!expiresAt) return;
    const refreshIn = Math.max(1000, expiresAt - Date.now() - 5000);
    const timeout = window.setTimeout(() => void refreshToken(), refreshIn);
    return () => window.clearTimeout(timeout);
  }, [expiresAt, refreshToken]);

  useEffect(() => {
    if (!fullScreen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFullScreen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [fullScreen]);

  const secondsLeft = expiresAt
    ? Math.max(0, Math.ceil((expiresAt - now) / 1000))
    : 0;
  const qrValue = useMemo(() => (token ? `GXC-PASS-V1:${token}` : ""), [token]);

  const passCard = (large = false) => (
    <article className="digital-pass-card w-full overflow-hidden rounded-[1.65rem] border border-[#d9c2f2] bg-white shadow-[0_24px_70px_rgba(54,18,92,.18)]">
      <div className="relative overflow-hidden bg-gradient-to-br from-[#21083f] via-[#5f2295] to-[#9d55d2] px-5 py-7 text-center text-white sm:px-8">
        <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-20 size-64 rounded-full border border-white/15 bg-white/5 blur-sm" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 -left-16 size-72 rounded-full border border-white/10 bg-fuchsia-300/10 blur-sm" />
        <div className="relative z-10">
          <div className="mb-3 flex items-center justify-center gap-2 text-xs font-black tracking-[.2em]">
            <span className="grid size-8 place-items-center rounded-lg border border-white/30 bg-white/10">
              <span className="text-lg">‹›</span>
            </span>
            GENXCODE
          </div>
          <p className="font-serif text-3xl font-bold tracking-tight sm:text-4xl">HACKATHON 2026</p>
          <p className="mt-2 text-[10px] font-bold tracking-[.28em] text-white/80">LEARN · BUILD · PITCH</p>
          <div className="mx-auto mt-5 w-fit rounded-full border border-white/30 bg-white/15 px-4 py-1.5 text-[10px] font-extrabold tracking-[.12em]">
            OFFICIAL PARTICIPANT PASS
          </div>
        </div>
      </div>

      <div className="relative bg-[radial-gradient(ellipse_at_top,#f8efff_0%,#ffffff_58%)] px-5 pb-5 pt-6 text-center sm:px-8">
        <h2 className="break-words text-xl font-extrabold tracking-tight text-[#26094a] sm:text-2xl">{fullName}</h2>
        <p className="mt-2 inline-flex rounded-full bg-[#f0e4fc] px-4 py-1 text-xs font-semibold text-[#64329a]">Individual Participant</p>

        <div className="mx-auto mt-5 flex aspect-square w-full items-center justify-center rounded-2xl border border-[#eadcf8] bg-white p-3 shadow-inner sm:p-4" style={{ maxWidth: large ? 300 : 248 }}>
          {loading && !qrValue ? (
            <div className="flex flex-col items-center gap-3 text-[#76519b]">
              <LoaderCircle className="animate-spin" size={30}/>
              <span className="text-xs font-semibold">Generating secure QR…</span>
            </div>
          ) : qrValue ? (
            <QRCodeSVG
              value={qrValue}
              size={large ? 268 : 216}
              level="H"
              marginSize={4}
              bgColor="#ffffff"
              fgColor="#160b20"
              title="GenXCode participant verification QR"
              className="h-auto max-w-full"
            />
          ) : (
            <div className="flex flex-col items-center gap-3 px-4 text-[#76519b]">
              <LockKeyhole size={30}/>
              <span className="text-sm font-semibold">QR temporarily unavailable</span>
            </div>
          )}
        </div>

        <div className="mt-5 grid grid-cols-2 divide-x divide-[#e9ddf4] border-y border-[#e9ddf4] py-4">
          <div className="px-2">
            <p className="text-[10px] font-bold tracking-[.12em] text-[#8a789d]">APPLICATION ID</p>
            <p className="mt-1 break-all text-sm font-extrabold text-[#26094a]">{applicationNumber}</p>
          </div>
          <div className="px-2">
            <p className="text-[10px] font-bold tracking-[.12em] text-[#8a789d]">PASS STATUS</p>
            <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-bold text-[#16834a]"><CheckCircle2 size={15}/> Active</p>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-center gap-2 text-[10px] font-bold tracking-[.18em] text-[#76519b]">
          GENXCODE HACKATHON 2026
        </div>
      </div>
    </article>
  );

  return (
    <>
      <main className="container-shell min-h-screen py-8 sm:py-12">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-[#69408e] transition hover:text-[#3e1768]">
          <ArrowLeft size={16}/> Back to dashboard
        </Link>

        <div className="mt-7 grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section>
            <p className="eyebrow mb-3">YOUR OFFICIAL EVENT CREDENTIAL</p>
            <h1 className="editorial text-4xl leading-tight text-[#220749] sm:text-5xl">My Digital Pass</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#76678a]">Your official participant pass for GenXCode Hackathon 2026. Keep this screen ready when you arrive at the venue.</p>
            <div className="mt-7 grid items-start gap-5 md:grid-cols-[minmax(0,1fr)_minmax(210px,.72fr)]">
              <div className="mx-auto w-full max-w-[460px]">{passCard()}</div>
              <div className="space-y-4">
                <button type="button" onClick={() => setFullScreen(true)} disabled={!qrValue} className="btn-primary w-full gap-2 disabled:cursor-not-allowed disabled:opacity-50">
                  <Expand size={16}/> View full screen
                </button>
                <div className="card-hover rounded-2xl bg-white p-5">
                  <div className="flex items-center gap-2 text-[#5f2295]"><ShieldCheck size={19}/><h2 className="text-sm font-bold text-[#32105b]">About your pass</h2></div>
                  <ul className="mt-4 space-y-3 text-sm leading-6 text-[#665577]">
                    <li className="flex gap-2"><CheckCircle2 className="mt-1 shrink-0 text-[#5f2295]" size={15}/> Your official participant identity credential.</li>
                    <li className="flex gap-2"><RefreshCw className="mt-1 shrink-0 text-[#5f2295]" size={15}/> QR refreshes automatically every 30 seconds.</li>
                    <li className="flex gap-2"><LockKeyhole className="mt-1 shrink-0 text-[#5f2295]" size={15}/> The QR contains a temporary verification token, not your personal details.</li>
                    <li className="flex gap-2"><Ticket className="mt-1 shrink-0 text-[#5f2295]" size={15}/> Keep this pass ready at the venue.</li>
                  </ul>
                </div>
                <div className="rounded-2xl border border-[#eadcf8] bg-[#f8f2ff] p-4">
                  <div className="flex items-center justify-between gap-2 text-xs font-semibold text-[#5f2295]">
                    <span className="inline-flex items-center gap-2"><Clock3 size={15}/> QR refresh</span>
                    <span>{loading ? "Updating…" : qrValue ? `${secondsLeft}s remaining` : "Unavailable"}</span>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#e7d8f5]">
                    <div className="h-full rounded-full bg-gradient-to-r from-[#5f2295] to-[#a66de0] transition-[width] duration-1000" style={{ width: `${Math.min(100, (secondsLeft / 30) * 100)}%` }}/>
                  </div>
                  {error && <p role="alert" className="mt-3 text-xs leading-5 text-red-700">{error}</p>}
                  <button type="button" onClick={() => void refreshToken()} disabled={loading} className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-[#5f2295] disabled:opacity-50">
                    <RefreshCw size={13} className={loading ? "animate-spin" : ""}/> Refresh now
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {fullScreen && (
        <div className="fixed inset-0 z-[100] flex min-h-[100dvh] items-center justify-center overflow-y-auto bg-[#170628] px-4 py-8">
          <button type="button" onClick={() => setFullScreen(false)} aria-label="Close full-screen pass" className="absolute right-5 top-5 inline-flex size-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white hover:bg-white/20">
            <X size={21}/>
          </button>
          <div className="w-full max-w-[430px] pt-8">
            <div className="mb-5 text-center text-sm font-bold text-white">MY DIGITAL PASS</div>
            {passCard(true)}
            <div className="mt-5 flex items-center justify-center gap-2 text-sm font-semibold text-white">
              <RefreshCw size={16} className={loading ? "animate-spin" : ""}/>
              {loading ? "Refreshing secure QR…" : qrValue ? `QR refreshes in ${secondsLeft}s` : "QR unavailable"}
            </div>
            {error && <p role="alert" className="mt-3 text-center text-sm text-red-200">{error}</p>}
            <p className="mt-3 text-center text-xs text-white/60">Keep your screen brightness high for scanning.</p>
          </div>
        </div>
      )}
    </>
  );
}
