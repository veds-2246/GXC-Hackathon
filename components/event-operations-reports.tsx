"use client";

import { useState } from "react";
import { Download, Search, LoaderCircle } from "lucide-react";

type Participant = { registration_id: string; participant_name: string; application_number: string; participant_email: string; checked_in_at: string | null; snack_claims: number };

function formatAttendanceTime(value: string | null) {
  if (!value) return "Not checked in";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata", day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).format(new Date(value)).replace(",", "");
}

export function EventOperationsReports({ allowExport = true }: { allowExport?: boolean }) {
  const [query, setQuery] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function search() {
    setLoading(true); setError("");
    try {
      const response = await fetch(`/api/event-operations/participants?q=${encodeURIComponent(query)}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Search failed.");
      setParticipants(data.participants ?? []); setSearched(true);
    } catch (e) { setError(e instanceof Error ? e.message : "Search failed."); }
    finally { setLoading(false); }
  }

  return <section className="mt-7 rounded-2xl border border-[#eadff5] bg-white p-5 sm:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="eyebrow">PARTICIPANT RECORDS</p><h2 className="editorial mt-2 text-3xl">Attendance lookup.</h2></div>{allowExport && <a href="/api/event-operations/export" className="inline-flex items-center gap-2 rounded-full border border-[#eadff5] px-4 py-2.5 text-xs font-semibold text-[#5f2295]"><Download size={15}/> Export CSV</a>}</div>
    <div className="mt-5 flex flex-col gap-2 sm:flex-row"><input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==="Enter") void search();}} placeholder="Search name, email or application number" className="min-w-0 flex-1 rounded-xl border border-[#eadff5] px-4 py-3 text-sm outline-none focus:border-[#5f2295]"/><button type="button" onClick={()=>void search()} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#5f2295] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{loading?<><LoaderCircle className="animate-spin" size={15}/> Searching…</>:<><Search size={15}/> Search</>}</button></div>
    {error && <p role="alert" className="mt-3 text-xs text-red-700">{error}</p>}
    {searched && <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[650px] text-left text-xs"><thead className="border-b border-[#eadff5] text-[#8a789d]"><tr><th className="py-3 pr-3">Participant</th><th className="py-3 pr-3">Application</th><th className="py-3 pr-3">Attendance</th><th className="py-3">Snack claims</th></tr></thead><tbody>{participants.map(p=><tr key={p.registration_id} className="border-b border-[#f2edf6]"><td className="py-3 pr-3"><p className="font-semibold text-[#32105b]">{p.participant_name}</p><p className="mt-1 text-[#8a789d]">{p.participant_email}</p></td><td className="py-3 pr-3">{p.application_number}</td><td className="py-3 pr-3">{formatAttendanceTime(p.checked_in_at)}</td><td className="py-3">{p.snack_claims}</td></tr>)}</tbody></table>{participants.length===0&&<p className="py-7 text-center text-sm text-[#8a789d]">No matching confirmed participants.</p>}</div>}
    {!searched && <p className="mt-4 text-xs text-[#8a789d]">Search results show up to 100 confirmed registrations. Export CSV downloads the full event register.</p>}
  </section>;
}