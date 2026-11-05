*** Begin Patch
*** Update File: app/dashboard/page.tsx
@@
 export default async function DashboardPage() {
+  const localDevBypass = process.env.LOCAL_DEV_BYPASS === "true";
+  if (localDevBypass) {
+    const demoEvents = [
+      { id: "demo-event-1", day_number: 1, title: "Opening Ceremony & Keynote", venue: "Main Auditorium", timing: "9:30 AM – 10:30 AM", pre_instructions: "Arrive 15 minutes early and keep your college ID ready." },
+      { id: "demo-event-2", day_number: 1, title: "Hackathon Begins", venue: "Innovation Lab", timing: "11:00 AM onwards", pre_instructions: "Keep your team details and laptop ready." },
+      { id: "demo-event-3", day_number: 2, title: "Mentor Reviews", venue: "Project Arena", timing: "2:00 PM – 5:00 PM", pre_instructions: "Prepare a short demonstration of your progress." },
+    ];
+    const demoProblems = [
+      { id: "demo-problem-1", title: "Accessible Campus", summary: "Build technology that makes campus facilities easier to discover and access.", domain: "Civic Tech", difficulty: "Intermediate", max_slots: 20, filled_slots: 8 },
+      { id: "demo-problem-2", title: "Smart Resource Management", summary: "Create a solution that helps communities reduce resource waste.", domain: "Sustainability", difficulty: "Beginner", max_slots: 15, filled_slots: 6 },
+      { id: "demo-problem-3", title: "AI for Everyday Learning", summary: "Design a practical learning assistant for students and educators.", domain: "Education", difficulty: "Advanced", max_slots: 12, filled_slots: 12 },
+    ];
+    return <main className="min-h-screen bg-[#fafaf7]">
+      <header className="border-b border-[#e4e4dd] bg-white"><div className="container-shell flex h-[76px] items-center justify-between">
+        <Link href="/" className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#1a56db] text-white"><Code2 size={21}/></span><span className="font-bold">GenXCode <span className="font-normal text-[#697386]">/ Dashboard</span></span></Link>
+        <div className="flex items-center gap-3"><Link href="/admin" className="inline-flex items-center gap-1 rounded-full border border-[#e4e4dd] px-4 py-2.5 text-xs font-semibold hover:bg-[#f4f4ef]">Admin panel <ArrowUpRight size={13}/></Link><Link href="/register" className="inline-flex items-center gap-2 rounded-full border border-[#e4e4dd] px-4 py-2.5 text-xs font-semibold hover:bg-[#f4f4ef]">Registration preview</Link></div>
+      </div></header>
+      <section className="container-shell py-14">
+        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] font-bold tracking-wide text-amber-800">LOCAL PREVIEW · DEMO DATA ONLY</div>
+        <p className="eyebrow mb-4">PARTICIPANT SPACE</p><h1 className="editorial text-5xl sm:text-6xl">Good to have you here, Alex.</h1>
+        <p className="mt-4 max-w-xl text-sm leading-6 text-[#697386]">Explore the participant dashboard with sample information. No account, payment or database connection is required.</p>
+        <div className="mt-10 grid gap-5 md:grid-cols-[1.2fr_.8fr]">
+          <article className="rounded-2xl border border-[#e4e4dd] bg-white p-7"><div className="mb-8 flex items-center justify-between"><span className="eyebrow">YOUR ACCOUNT</span><UserRound className="text-[#1a56db]" size={21}/></div><p className="text-xs text-[#9aa1ad]">Preview account</p><p className="mt-1 break-all text-lg font-semibold">alex.participant@example.com</p><p className="mt-5 text-xs text-[#9aa1ad]">Application number</p><p className="editorial mt-1 text-3xl">GXC-2026-0042</p><p className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-[#1e8e3e]"><CheckCircle2 size={15}/> Demo payment status</p></article>
+          <article className="rounded-2xl bg-[#0b0f19] p-7 text-white"><p className="text-[10px] font-bold tracking-[.18em] text-[#8db2ff]">REGISTRATION STATUS</p><h2 className="editorial mt-5 text-3xl">You’re on the list.</h2><p className="mt-3 text-sm leading-6 text-[#a4adbd]">This is a sample participant record for checking dashboard layout and responsive behaviour.</p><p className="mt-8 text-xs font-semibold capitalize text-[#8db2ff]">Confirmed · Demo</p></article>
+        </div>
+        <DashboardUpdates events={demoEvents} problems={demoProblems} selectedProblemStatementId="demo-problem-1" localPreview />
+      </section>
+    </main>;
+  }
   const supabase = await createClient();
*** Update File: components/dashboard-updates.tsx
@@
   selectedProblemStatementId,
+  localPreview = false,
 }: {
@@
   selectedProblemStatementId: string | null;
+  localPreview?: boolean;
 }) {
-  const supabase = createClient();
+  const supabase = localPreview ? null : createClient();
@@
     setSaving(true);
     setError("");
     setSaved(false);
+    if (localPreview) {
+      setSaving(false);
+      setSaved(true);
+      return;
+    }
+    if (!supabase) return;
@@
-            {saved && <p role="status" className="mt-4 flex items-center gap-2 text-sm font-medium text-[#1e8e3e]"><CheckCircle2 size={16}/> Your problem statement selection is saved.</p>}
+            {saved && <p role="status" className="mt-4 flex items-center gap-2 text-sm font-medium text-[#1e8e3e]"><CheckCircle2 size={16}/> {localPreview ? "Preview selection updated locally (not saved to a database)." : "Your problem statement selection is saved."}</p>}
@@
-              {saving ? <><LoaderCircle className="animate-spin" size={16}/> Saving…</> : "Save selection"}
+              {saving ? <><LoaderCircle className="animate-spin" size={16}/> Saving…</> : localPreview ? "Preview selection" : "Save selection"}
*** End Patch