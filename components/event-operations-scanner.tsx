"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CameraOff, CheckCircle2, CircleAlert, LoaderCircle, ScanLine, Search, Utensils, UserCheck } from "lucide-react";

type ScanResult = { result: string; participant_name?: string; application_number?: string; participant_email?: string; occurred_at?: string; snack_policy?: string; error?: string };
type Props = { dayCount: number; permission: string };

export function EventOperationsScanner({ dayCount, permission }: Props) {
  const [action, setAction] = useState<"checkin" | "snack">(permission === "snacks" ? "snack" : "checkin");
  const [day, setDay] = useState(1);
  const [manualToken, setManualToken] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<{ detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>> } | null>(null);
  const frameRef = useRef<number | null>(null);
  const busyRef = useRef(false);

  const canCheckin = permission === "admin" || permission === "checkin" || permission === "both";
  const canSnacks = permission === "admin" || permission === "snacks" || permission === "both";

  const stopCamera = useCallback(() => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    setCameraOn(false);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const processToken = useCallback(async (raw: string) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setResult(null);
    try {
      const response = await fetch("/api/event-operations/scan", {
        method: "POST", cache: "no-store", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: raw, action, eventDay: day }),
      });
      const data = await response.json() as ScanResult;
      setResult(response.ok ? data : { result: "error", error: data.error || "Unable to process this pass." });
      if (response.ok && ["checked_in", "snack_distributed", "already_checked_in", "already_distributed", "invalid"].includes(data.result)) stopCamera();
    } catch {
      setResult({ result: "error", error: "Network error. Check your connection and try again." });
    } finally {
      setBusy(false);
      busyRef.current = false;
    }
  }, [action, day, stopCamera]);

  const startCamera = async () => {
    setCameraError("");
    setResult(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera access is unavailable. Use manual token entry below.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      const BarcodeDetectorConstructor = (window as unknown as { BarcodeDetector?: new (options?: { formats: string[] }) => { detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>> } }).BarcodeDetector;
      if (!BarcodeDetectorConstructor) {
        setCameraError("This browser does not support QR scanning. Use manual token entry instead.");
        stopCamera();
        return;
      }
      detectorRef.current = new BarcodeDetectorConstructor({ formats: ["qr_code"] });
      setCameraOn(true);
      const scanFrame = async () => {
        if (!videoRef.current || !detectorRef.current || busyRef.current) {
          frameRef.current = requestAnimationFrame(scanFrame);
          return;
        }
        try {
          const codes = await detectorRef.current.detect(videoRef.current);
          if (codes[0]?.rawValue) {
            await processToken(codes[0].rawValue);
            return;
          }
        } catch { /* Camera frame may not be ready yet. */ }
        frameRef.current = requestAnimationFrame(scanFrame);
      };
      frameRef.current = requestAnimationFrame(scanFrame);
    } catch {
      setCameraError("Camera permission was denied or the camera is unavailable. Allow camera access or use manual token entry.");
      stopCamera();
    }
  };

  const success = result?.result === "checked_in" || result?.result === "snack_distributed";
  const duplicate = result?.result === "already_checked_in" || result?.result === "already_distributed";
  const invalid = result?.result === "invalid" || result?.result === "error";

  return <section className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
    <div className="rounded-2xl border border-[#eadff5] bg-white p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="eyebrow">LIVE SCANNER</p><h2 className="editorial mt-2 text-3xl">Verify participant.</h2></div>
        <span className="rounded-full bg-[#f4effc] px-3 py-1.5 text-xs font-semibold text-[#5f2295]">Day {day}</span>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {canCheckin && <button type="button" onClick={() => { setAction("checkin"); setResult(null); }} className={action === "checkin" ? "rounded-xl border-2 border-[#5f2295] bg-[#f8f2ff] p-4 text-left" : "rounded-xl border border-[#eadff5] p-4 text-left"}><UserCheck className="text-[#5f2295]"/><span className="mt-2 block text-sm font-bold text-[#32105b]">Event check-in</span><span className="mt-1 block text-xs text-[#76678a]">Mark participant as arrived</span></button>}
        {canSnacks && <button type="button" onClick={() => { setAction("snack"); setResult(null); }} className={action === "snack" ? "rounded-xl border-2 border-[#5f2295] bg-[#f8f2ff] p-4 text-left" : "rounded-xl border border-[#eadff5] p-4 text-left"}><Utensils className="text-[#5f2295]"/><span className="mt-2 block text-sm font-bold text-[#32105b]">Snack distribution</span><span className="mt-1 block text-xs text-[#76678a]">Record a participant's snack</span></button>}
      </div>
      <label className="mt-5 block text-xs font-semibold text-[#57436d]">Event day
        <select value={day} onChange={e => setDay(Number(e.target.value))} className="mt-2 w-full rounded-xl border border-[#eadff5] bg-white px-4 py-3 text-sm">{Array.from({length: dayCount}, (_, i) => <option key={i+1} value={i+1}>Day {i+1}</option>)}</select>
      </label>
      <div className="mt-5 overflow-hidden rounded-2xl bg-[#170a25]">
        {cameraOn ? <video ref={videoRef} playsInline muted className="aspect-video w-full object-cover"/> : <div className="flex aspect-video flex-col items-center justify-center gap-3 text-white/80"><ScanLine size={42}/><p className="text-sm font-semibold">Camera scanner ready</p><p className="text-xs text-white/50">Use your phone's rear camera for best results</p></div>}
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        {!cameraOn ? <button type="button" onClick={startCamera} className="inline-flex items-center gap-2 rounded-full bg-[#5f2295] px-5 py-3 text-sm font-semibold text-white"><Camera size={16}/> Start camera</button> : <button type="button" onClick={stopCamera} className="inline-flex items-center gap-2 rounded-full border border-[#eadff5] px-5 py-3 text-sm font-semibold text-[#5f2295]"><CameraOff size={16}/> Stop camera</button>}
        {busy && <span className="inline-flex items-center gap-2 text-sm text-[#76678a]"><LoaderCircle className="animate-spin" size={16}/> Verifying…</span>}
      </div>
      {cameraError && <p role="status" className="mt-3 text-xs leading-5 text-amber-700">{cameraError}</p>}
      <div className="mt-7 border-t border-[#f0e8f7] pt-5">
        <label className="block text-xs font-semibold text-[#57436d]">Manual token / QR value</label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input value={manualToken} onChange={e => setManualToken(e.target.value)} placeholder="Paste GXC-PASS-V1 token" className="min-w-0 flex-1 rounded-xl border border-[#eadff5] px-4 py-3 text-sm outline-none focus:border-[#5f2295]"/>
          <button type="button" disabled={!manualToken.trim() || busy} onClick={() => void processToken(manualToken)} className="inline-flex items-center justify-center gap-2 rounded-full border border-[#5f2295] px-5 py-3 text-sm font-semibold text-[#5f2295] disabled:opacity-50"><Search size={16}/> Verify</button>
        </div>
      </div>
    </div>
    <aside className="rounded-2xl border border-[#eadff5] bg-white p-5">
      <p className="eyebrow">VERIFICATION RESULT</p>
      {!result ? <div className="py-12 text-center text-[#8a789d]"><ScanLine className="mx-auto" size={36}/><p className="mt-3 text-sm font-semibold">Waiting for a pass</p><p className="mt-1 text-xs">Scan a participant QR to see the result here.</p></div> : <div className="mt-5">
        <div className={success ? "rounded-xl bg-green-50 p-4 text-green-800" : duplicate ? "rounded-xl bg-amber-50 p-4 text-amber-800" : "rounded-xl bg-red-50 p-4 text-red-800"}>
          {success ? <CheckCircle2 size={30}/> : <CircleAlert size={30}/>}
          <p className="mt-2 text-lg font-bold">{result.result === "checked_in" ? "Check-in successful" : result.result === "snack_distributed" ? "Snack recorded" : result.result === "already_checked_in" ? "Already checked in" : result.result === "already_distributed" ? "Snack already claimed" : result.result === "invalid" ? "Invalid or expired pass" : "Unable to verify"}</p>
          <p className="mt-1 text-xs leading-5">{result.error || (duplicate ? "This action was already recorded. No duplicate entry was created." : invalid ? "Ask the participant to refresh their digital pass and scan again." : "The operation was saved successfully.")}</p>
        </div>
        {result.participant_name && <div className="mt-5 space-y-3"><div><p className="text-[10px] font-bold tracking-wider text-[#8a789d]">PARTICIPANT</p><p className="mt-1 font-bold text-[#32105b]">{result.participant_name}</p></div><div><p className="text-[10px] font-bold tracking-wider text-[#8a789d]">APPLICATION NUMBER</p><p className="mt-1 text-sm font-semibold">{result.application_number}</p></div><div><p className="text-[10px] font-bold tracking-wider text-[#8a789d]">EMAIL</p><p className="mt-1 break-all text-sm">{result.participant_email}</p></div></div>}
        <button type="button" onClick={() => { setResult(null); setManualToken(""); }} className="mt-6 w-full rounded-full bg-[#5f2295] px-5 py-3 text-sm font-semibold text-white">Scan next participant</button>
      </div>}
    </aside>
  </section>;
}