"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, MapPin, Clock3, ClipboardList, CheckCircle2, LoaderCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type WorkshopSettings = {
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
  workshop,
  problems,
  selectedProblemStatementId,
}: {
  workshop: WorkshopSettings | null;
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

    const { error: selectionError } = await supabase.rpc(
      "select_registration_problem_statement",
      { p_problem_statement_id: selectedId },
    );

    setSaving(false);
    if (selectionError) {
      setError(selectionError.message);
      return;
    }

    setSaved(true);
    router.refresh();
  }

  const selectedProblem = problems.find((problem) => problem.id === selectedId);

  return (
    <div className="mt-8 space-y-6">
      {workshop && <section className="rounded-2xl border border-[#e4e4dd] bg-white p-7 sm:p-8">
        <div className="flex items-start gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#fff4d6] text-[#a66a00]">
            <CalendarDays size={21} />
          </span>
          <div>
            <p className="eyebrow">DAY 1 · WORKSHOP INVITATION</p>
            <h2 className="editorial mt-2 text-3xl">{workshop?.title || "AI Workshop"}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#697386]">
              You’re invited to the Day 1 AI workshop. Keep these details handy before arriving at the venue.
            </p>
          </div>
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-[#f7f8fa] p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#697386]"><MapPin size={15} /> VENUE</div>
            <p className="mt-2 text-sm font-semibold text-[#111827]">{workshop?.venue?.trim() || "Venue to be announced"}</p>
          </div>
          <div className="rounded-xl bg-[#f7f8fa] p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#697386]"><Clock3 size={15} /> TIMING</div>
            <p className="mt-2 whitespace-pre-wrap text-sm font-semibold text-[#111827]">{workshop?.timing?.trim() || "Timing to be announced"}</p>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-[#e4e4dd] p-5">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#697386]"><ClipboardList size={15} /> PRE-INSTRUCTIONS</div>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#374151]">
            {workshop?.pre_instructions?.trim() || "Pre-workshop instructions will be shared here. Please check this section again before Day 1."}
          </p>
        </div>
      </section>}

      <section className="rounded-2xl border border-[#e4e4dd] bg-white p-7 sm:p-8">
        <p className="eyebrow">HACKATHON</p>
        <h2 className="editorial mt-2 text-3xl">Choose your problem statement</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#697386]">
          Select one problem statement published by the GenXCode organizers. You can update your selection while it remains available.
        </p>

        {problems.length === 0 ? (
          <p className="mt-6 rounded-xl bg-[#f7f8fa] p-4 text-sm text-[#697386]">
            Problem statements have not been published yet. They will appear here once the organizers make them available.
          </p>
        ) : (
          <>
            <label className="mt-6 block text-xs font-semibold text-[#374151]">
              Problem statement
              <select
                value={selectedId}
                onChange={(event) => { setSelectedId(event.target.value); setSaved(false); setError(""); }}
                className="mt-2 w-full rounded-xl border border-[#dfe3ea] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#1a56db] focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Select a problem statement</option>
                {problems.map((problem) => {
                  const full = problem.max_slots !== null && problem.filled_slots >= problem.max_slots;
                  return (
                    <option key={problem.id} value={problem.id} disabled={full && problem.id !== selectedId}>
                      {problem.title}{problem.domain ? ` · ${problem.domain}` : ""}{problem.difficulty ? ` · ${problem.difficulty}` : ""}{full && problem.id !== selectedId ? " · Full" : ""}
                    </option>
                  );
                })}
              </select>
            </label>

            {selectedProblem && (
              <div className="mt-4 rounded-xl bg-[#f7f8fa] p-4">
                <p className="text-sm font-semibold text-[#111827]">{selectedProblem.title}</p>
                <p className="mt-2 text-sm leading-6 text-[#697386]">{selectedProblem.summary}</p>
              </div>
            )}

            {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
            {saved && <p role="status" className="mt-4 flex items-center gap-2 text-sm font-medium text-[#1e8e3e]"><CheckCircle2 size={16} /> Your problem statement selection is saved.</p>}

            <button
              type="button"
              onClick={saveSelection}
              disabled={!selectedId || saving || selectedId === selectedProblemStatementId}
              className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-[#1a56db] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#1649bd] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? <><LoaderCircle className="animate-spin" size={16} /> Saving…</> : "Save selection"}
            </button>
            {selectedProblemStatementId && <p className="mt-3 text-xs text-[#8992a1]">Your current selection is saved. Choose a different option and save to change it.</p>}
          </>
        )}
      </section>
    </div>
  );
}
