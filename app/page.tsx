import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Code2,
  Cpu,
  GraduationCap,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";

const days = [
  {
    day: "01",
    label: "Learn",
    title: "Start with the why.",
    description: "An AI-focused workshop with Google for Developers. Learn the tools and ideas that will power your build.",
    icon: GraduationCap,
  },
  {
    day: "02",
    label: "Build",
    title: "Turn ideas into impact.",
    description: "An intense 8–12 hour hackathon. Experiment and ship something that matters.",
    icon: Code2,
  },
  {
    day: "03",
    label: "Pitch",
    title: "Make your work count.",
    description: "The top 60 shortlisted students take the stage for the pitching round, judging and prizes.",
    icon: Trophy,
  },
];

const highlights = [
  { icon: Cpu, title: "Build with AI", text: "Explore real-world problem statements and emerging technologies." },
  { icon: Users, title: "Find your people", text: "Meet builders, mentors and students who love solving problems." },
  { icon: Trophy, title: "Show what you can do", text: "Present your work, get feedback and compete for recognition." },
];

export default function Home() {
  return (
    <main className="overflow-hidden">
      <div className="border-b border-[#e4e4dd] bg-[#f4f4ef]">
        <div className="container-shell flex min-h-9 items-center justify-between gap-4 text-[11px] text-[#5b6472]">
          <span>GENXCODE PRESENTS <span className="mx-2 text-[#1a56db]">✳</span> TECH FEST 2026</span>
          <span className="hidden sm:block">LEARN. BUILD. PITCH.</span>
        </div>
      </div>

      <header className="container-shell flex h-[76px] items-center justify-between">
        <a href="#" className="flex items-center gap-3" aria-label="GenXCode home">
          <span className="grid size-10 place-items-center rounded-xl bg-[#1a56db] text-white shadow-lg shadow-blue-900/15">
            <Code2 size={21} strokeWidth={2.2} />
          </span>
          <span className="leading-tight">
            <span className="block text-[15px] font-bold tracking-tight">GenXCode</span>
            <span className="block text-[10px] tracking-[.16em] text-[#697386]">TECH FEST</span>
          </span>
        </a>
        <nav className="hidden items-center gap-8 text-[13px] font-medium text-[#4b5563] md:flex">
          <a className="transition hover:text-[#1a56db]" href="#experience">The experience</a>
          <a className="transition hover:text-[#1a56db]" href="#schedule">Schedule</a>
          <a className="transition hover:text-[#1a56db]" href="#about">About</a>
        </nav>
        <a href="/signup" className="inline-flex items-center gap-2 rounded-full bg-[#1a56db] px-5 py-3 text-xs font-semibold text-white shadow-lg shadow-blue-900/15 transition hover:-translate-y-0.5 hover:bg-[#1649bd]">
          Get your Pass <ArrowUpRight size={14} />
        </a>
      </header>

      <section className="container-shell relative grid min-h-[650px] items-center gap-12 py-20 lg:grid-cols-[1.1fr_.9fr] lg:py-24">
        <div className="pointer-events-none absolute -left-48 top-20 size-[440px] rounded-full bg-blue-200/30 blur-[100px]" />
        <div className="relative z-10">
          <div className="eyebrow mb-7 flex items-center gap-2">
            <span className="size-2 rounded-full bg-[#1e8e3e]" />
            A three-day celebration of building
          </div>
          <h1 className="editorial max-w-[720px] text-[clamp(4rem,8vw,7.4rem)] leading-[.88] text-[#111827]">
            Ideas are<br />
            <span className="italic text-[#1a56db]">only the</span><br />
            beginning<span className="text-[#f9ab00]">.</span>
          </h1>
          <p className="mt-8 max-w-[470px] text-[15px] leading-7 text-[#5b6472]">
            Three days to learn, build and pitch. Bring your curiosity, meet fellow builders and turn a bold idea into something real.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4" id="register">
            <a href="#schedule" className="inline-flex items-center gap-3 rounded-full bg-[#1a56db] px-7 py-4 text-sm font-semibold text-white shadow-xl shadow-blue-900/15 transition hover:-translate-y-1 hover:bg-[#1649bd]">
              Explore the event <ArrowRight size={16} />
            </a>
            <a href="#schedule" className="inline-flex items-center gap-2 px-3 py-4 text-sm font-semibold text-[#374151] transition hover:text-[#1a56db]">
              Explore the event <ArrowDownRight size={16} />
            </a>
          </div>
          <div className="mt-14 flex flex-wrap gap-x-8 gap-y-4 border-t border-[#e4e4dd] pt-7">
            <div><p className="editorial text-3xl">03</p><p className="mt-1 text-[10px] uppercase tracking-[.15em] text-[#7b8492]">Days</p></div>
            <div><p className="editorial text-3xl">60</p><p className="mt-1 text-[10px] uppercase tracking-[.15em] text-[#7b8492]">Finalists</p></div>
            <div><p className="editorial text-3xl">∞</p><p className="mt-1 text-[10px] uppercase tracking-[.15em] text-[#7b8492]">Possibilities</p></div>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[490px]">
          <div className="grid-paper relative aspect-[.88] overflow-hidden rounded-[28px] border border-[#dce3ef] bg-[#edf2fb] p-6 sm:p-8">
            <div className="absolute -right-20 -top-16 size-72 rounded-full border border-[#1a56db]/15" />
            <div className="absolute -right-5 -top-1 size-52 rounded-full border border-[#1a56db]/20" />
            <div className="absolute -right-12 top-12 size-36 rounded-full bg-[#f9ab00]/80 blur-[1px]" />
            <div className="absolute bottom-8 left-8 right-8 top-8 flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="rounded-full border border-[#1a56db]/20 bg-white/70 px-3 py-2 text-[10px] font-semibold tracking-[.14em] text-[#1a56db]">GXC / 2026</span>
                <Sparkles className="text-[#1a56db]" size={22} />
              </div>
              <div className="relative">
                <div className="editorial text-[clamp(5rem,12vw,9rem)] leading-[.78] text-[#1a56db]">G<span className="italic text-[#111827]">X</span></div>
                <p className="mt-5 max-w-[250px] text-sm leading-6 text-[#4b5563]">A meeting point for curious minds and fearless makers.</p>
              </div>
              <div className="flex items-end justify-between border-t border-[#1a56db]/20 pt-4">
                <span className="text-[10px] font-semibold tracking-[.16em] text-[#52617a]">LEARN / BUILD / PITCH</span>
                <span className="grid size-11 place-items-center rounded-full bg-[#1a56db] text-white"><ArrowUpRight size={19}/></span>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-5 -left-5 hidden rounded-2xl border border-[#e4e4dd] bg-white p-4 shadow-xl shadow-slate-900/5 sm:block">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-xl bg-[#fff5d9] text-[#b77900]"><CalendarDays size={17}/></span>
              <div><p className="text-xs font-bold">Three days. One big idea.</p><p className="mt-1 text-[10px] text-[#7b8492]">Your next chapter starts here.</p></div>
            </div>
          </div>
        </div>
      </section>

      <section id="experience" className="border-y border-[#e4e4dd] bg-white py-20">
        <div className="container-shell">
          <div className="mb-12 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div><p className="eyebrow mb-4">Why be here</p><h2 className="editorial max-w-[560px] text-5xl leading-[.98] sm:text-6xl">More than an event.<br/><span className="italic text-[#1a56db]">A place to begin.</span></h2></div>
            <p className="max-w-[310px] text-sm leading-6 text-[#697386]">Learn from the community, make something useful and share it with the world.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {highlights.map((item, index) => {
              const Icon = item.icon;
              return <article key={item.title} className="group rounded-2xl border border-[#e8e9e5] bg-[#fafaf7] p-7 transition hover:-translate-y-1 hover:border-[#b9caf1] hover:bg-white hover:shadow-xl hover:shadow-blue-900/5">
                <div className="mb-12 flex items-center justify-between"><span className="text-xs text-[#9aa1ad]">0{index + 1}</span><span className="grid size-11 place-items-center rounded-xl bg-[#eaf0ff] text-[#1a56db]"><Icon size={20}/></span></div>
                <h3 className="editorial text-3xl">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#697386]">{item.text}</p>
              </article>;
            })}
          </div>
        </div>
      </section>

      <section id="schedule" className="container-shell py-24">
        <div className="mb-14"><p className="eyebrow mb-4">The journey</p><h2 className="editorial text-5xl sm:text-6xl">Three days. <span className="italic text-[#1a56db]">Three chapters.</span></h2></div>
        <div className="grid gap-0 md:grid-cols-3">
          {days.map((item, index) => {
            const Icon = item.icon;
            return <article key={item.day} className="relative border-t border-[#d9dcd7] py-8 md:border-l md:border-t-0 md:pl-8 md:pr-7">
              <div className="mb-12 flex items-center justify-between"><span className="editorial text-6xl text-[#d4d9e2]">{item.day}</span><Icon className="text-[#1a56db]" size={23}/></div>
              <p className="eyebrow mb-3">{item.label}</p>
              <h3 className="editorial text-3xl">{item.title}</h3>
              <p className="mt-4 max-w-[300px] text-sm leading-6 text-[#697386]">{item.description}</p>
              {index < 2 && <div className="mt-8 hidden h-px w-12 bg-[#1a56db] md:block" />}
            </article>;
          })}
        </div>
      </section>

      <section id="about" className="bg-[#0b0f19] py-20 text-white">
        <div className="container-shell grid gap-10 md:grid-cols-[1fr_auto] md:items-end">
          <div><p className="mb-5 text-[11px] font-bold tracking-[.18em] text-[#8db2ff]">YOUR MOVE</p><h2 className="editorial max-w-[650px] text-5xl leading-[.98] sm:text-7xl">The next big thing<br/><span className="italic text-[#8db2ff]">could start with you.</span></h2><p className="mt-6 max-w-[440px] text-sm leading-6 text-[#a4adbd]">Bring a question. Leave with a prototype, a new perspective or a team that keeps building.</p></div>
          <a href="/signup" className="inline-flex items-center justify-center gap-3 rounded-full bg-white px-7 py-4 text-sm font-semibold text-[#111827] transition hover:bg-[#dce7ff]">I&apos;m in <ArrowUpRight size={16}/></a>
        </div>
      </section>

      <footer className="container-shell flex flex-col justify-between gap-4 py-8 text-xs text-[#7b8492] sm:flex-row sm:items-center">
        <span>© 2026 GenXCode. Built for the curious.</span>
        <span className="tracking-[.14em]">LEARN. BUILD. PITCH.</span>
      </footer>
    </main>
  );
}
