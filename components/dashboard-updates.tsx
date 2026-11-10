"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, MapPin, Clock3, ClipboardList, CheckCircle2, LoaderCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type EventDetail = {
  id: string;
  day_number: number;
  title: string;
  venue: string | null;
  timing: string | null;
  pre_instructions: string | null;
};

type ProblemOption = {
  id: string;
  title: string;
  summary: string;
  domain: string | null;
  difficulty: string | null;
  max_slots: number | null;
  filled_slots: number;
};

export function DashboardUpdates({
  events,
  problems,
  selectedProblemStatementId,
}: {
  events: EventDetail[];
  problems: ProblemOption[];
  selectedProblemStatementId: string | null;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(selectedProblemStatementId ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function saveSelection() {
    if (!selectedId) {
      setError("Please select a problem statement first.");
      return;
    }
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const { error: selectionError } = await supabase.rpc(
        "select_registration_problem_statement",
        { p_problem_statement_id: selectedId },
      );
      if (selectionError) {
        setError("Your selection couldn't be saved. Please try again.");
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setError("We couldn't reach the server. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  const selectedProblem = problems.find((problem) => problem.id === selectedId);
  const groupedEvents = events.reduce<Record<number, EventDetail[]>>((groups, event) => {
    (groups[event.day_number] ??= []).push(event);
    return groups;
  }, {});
  const days = Object.keys(groupedEvents).map(Number).sort((a, b) => a - b);

  return (
    <div className="mt-8 space-y-6">
      <section className="card-hover reveal-on-scroll min-w-0 rounded-2xl border border-[#eadff5] bg-white p-5 sm:p-8">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-[#f4effc] text-[#5f2295]"><CalendarDays size={21}/></span>
          <div><p className="eyebrow">IMPORTANT INFORMATION</p><h2 className="editorial mt-1 text-3xl">Event schedule</h2></div>
        </div>

        {days.length === 0 ? (
          <p className="mt-6 rounded-xl bg-[#f8f3ff] p-4 text-sm leading-6 text-[#76678a]">
            Event details will appear here once the organizers publish them.
          </p>
        ) : (
          <div className="mt-7 space-y-6">
            {days.map((day) => (
              <section key={day} className="card-hover min-w-0 rounded-2xl border border-[#eadff5] bg-[#fcfaff] p-4 sm:p-5">
                <p className="eyebrow">DAY {day}</p>
                <div className="mt-3 space-y-4">
                  {groupedEvents[day].map((event) => (
                    <article key={event.id} className="card-hover min-w-0 rounded-xl bg-[#f8f3ff] p-4 sm:p-5">
                      <h3 className="break-words text-base font-semibold text-[#220749]">{event.title}</h3>
                      {(event.venue || event.timing) && (
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          {event.venue && <div className="flex items-start gap-2 text-sm leading-6 text-[#57436d]"><MapPin size={16} className="mt-1 shrink-0 text-[#76678a]"/><span>{event.venue}</span></div>}
                          {event.timing && <div className="flex items-start gap-2 whitespace-pre-wrap break-words text-sm leading-6 text-[#57436d]"><Clock3 size={16} className="mt-1 shrink-0 text-[#76678a]"/><span>{event.timing}</span></div>}
                        </div>
                      )}
                      {event.pre_instructions && (
                        <div className="mt-4 border-t border-[#eadff5] pt-4">
                          <div className="flex items-center gap-2 text-[10px] font-bold tracking-[.15em] text-[#76678a]"><ClipboardList size={14}/> PRE-INSTRUCTIONS</div>
                          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[#57436d]">{event.pre_instructions}</p>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </section>

      <section className="card-hover reveal-on-scroll rounded-2xl border border-[#eadff5] bg-white p-7 sm:p-8">
        <p className="eyebrow">HACKATHON</p>
        <h2 className="editorial mt-2 text-3xl">Choose your problem statement</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#76678a]">
          Select one problem statement published by the GenXCode organizers. You can update your selection while it remains available.
        </p>

        {problems.length === 0 ? (
          <p className="mt-6 rounded-xl bg-[#f8f3ff] p-4 text-sm text-[#76678a]">
            Problem statements have not been published yet. They will appear here once the organizers make them available.
          </p>
        ) : (
          <>
            <label className="mt-6 block text-xs font-semibold text-[#57436d]">
              Problem statement
              <select value={selectedId} onChange={(event) => { setSelectedId(event.target.value); setSaved(false); setError(""); }}
                className="mt-2 w-full rounded-xl border border-[#eadff5] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#5f2295] focus:ring-2 focus:ring-purple-100">
                <option value="">Select a problem statement</option>
                {problems.map((problem) => {
                  const full = problem.max_slots !== null && problem.filled_slots >= problem.max_slots;
                  return <option key={problem.id} value={problem.id} disabled={full && problem.id !== selectedId}>
                    {problem.title}{problem.domain ? ` · ${problem.domain}` : ""}{problem.difficulty ? ` · ${problem.difficulty}` : ""}{full && problem.id !== selectedId ? " · Full" : ""}
                  </option>;
                })}
              </select>
            </label>

            {selectedProblem && <div className="mt-4 rounded-xl bg-[#f8f3ff] p-4"><p className="text-sm font-semibold text-[#220749]">{selectedProblem.title}</p><p className="mt-2 text-sm leading-6 text-[#76678a]">{selectedProblem.summary}</p></div>}
            {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
            {saved && <p role="status" className="mt-4 flex items-center gap-2 text-sm font-medium text-[#1e8e3e]"><CheckCircle2 size={16}/> Your problem statement selection is saved.</p>}
            <button type="button" onClick={saveSelection} disabled={!selectedId || saving || selectedId === selectedProblemStatementId}
              className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-[#5f2295] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#4b1877] disabled:cursor-not-allowed disabled:opacity-50">
              {saving ? <><LoaderCircle className="animate-spin" size={16}/> Saving…</> : "Save selection"}
            </button>
            {selectedProblemStatementId && <p className="mt-3 text-xs text-[#8d7ba3]">Your current selection is saved. Choose a different option and save to change it.</p>}
          </>
        )}
      </section>
    </div>
  );
}
