import Image from "next/image";
import { BrandLockup } from "@/components/brand-lockup";
import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedDestination } from "@/lib/auth/get-authenticated-destination";
import { HackathonTeamIllustration } from "@/components/hackathon-team-illustration";
import {
  Code2,
  Cpu,
  GraduationCap,
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

export default async function Home() {
  const supabase = await createClient();
  const destination = await getAuthenticatedDestination(supabase);
  const ctaHref = destination ?? "/auth";
  const ctaLabel = destination === "/admin"
    ? "Admin Dashboard"
    : destination === "/volunteer/dashboard"
      ? "Volunteer Dashboard"
      : destination === "/dashboard"
        ? "Go to Dashboard"
        : destination === "/register"
          ? "Complete Registration"
          : "Get your Pass";

  return (
    <main className="overflow-hidden">
      <header className="container-shell surface-glass-nav sticky top-2 z-50 mt-2 flex min-h-[68px] items-center justify-between gap-2 rounded-2xl px-3 py-3 sm:top-3 sm:mt-3 sm:h-[76px] sm:px-6">
        <BrandLockup priority />
        <nav className="hidden items-center gap-8 text-[13px] font-medium text-[#57436d] md:flex">
          <a className="purple-hover" href="#experience">The experience</a>
          <a className="purple-hover" href="#schedule">Schedule</a>
          <a className="purple-hover" href="#about">About</a>
        </nav>
        <a href={ctaHref} className="btn-primary px-5 py-3 text-xs">
          {ctaLabel}
        </a>
      </header>

      {/* Main hero: editorial copy on the left, team illustration on the right */}
      <section className="hero-shell relative py-7 sm:py-9 lg:py-11">
        <div className="pointer-events-none absolute -left-36 top-8 size-[440px] rounded-full bg-[#c7a6f3]/25 blur-[115px]" />
        <div className="pointer-events-none absolute -right-28 bottom-0 size-[420px] rounded-full bg-[#8638cd]/14 blur-[120px]" />

        <div className="hero-layout reveal-on-scroll relative z-10 grid min-w-0 items-center gap-6 px-4 py-8 sm:gap-10 sm:px-8 sm:py-10 lg:min-h-[560px] lg:grid-cols-[1.02fr_.98fr] lg:gap-4 lg:px-16 lg:py-12">
          <div className="relative z-10">
            <p className="eyebrow mb-6">GENXCODE HACKATHON 2026</p>
            <h1 className="editorial max-w-[730px] text-[clamp(2.8rem,10.5vw,4.5rem)] sm:text-[clamp(3.55rem,6.8vw,7rem)] leading-[.86] text-[#220749]">
              Ideas are<br />
              <span className="text-purple-gradient italic">only the</span><br />
              beginning<span className="text-[#8638cd]">.</span>
            </h1>
            <p className="mt-7 max-w-[620px] text-[15px] leading-7 text-[#76678a] sm:text-base sm:leading-8">
              Three days to learn, build and pitch. Bring your curiosity, meet fellow builders and turn a bold idea into something real.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4" id="register">
              <a href={ctaHref} className="btn-primary px-7 py-4 text-sm">
                {ctaLabel}
              </a>
              <a href="#schedule" className="purple-hover rounded-full px-4 py-4 text-sm font-semibold text-[#57436d]">
                Explore the event
              </a>
            </div>
          </div>

          <div className="hero-art-wrap relative mx-auto flex min-h-[300px] w-full max-w-[640px] items-center justify-center sm:min-h-[390px] lg:min-h-[470px]">
            <span className="hero-art-glow" aria-hidden="true" />
            <span className="hero-art-orbit hero-art-orbit-one" aria-hidden="true" />
            <span className="hero-art-orbit hero-art-orbit-two" aria-hidden="true" />
            <span className="hero-art-sparkle hero-art-sparkle-one" aria-hidden="true">✦</span>
            <span className="hero-art-sparkle hero-art-sparkle-two" aria-hidden="true">✦</span>
            <HackathonTeamIllustration className="hero-art relative z-10 h-auto w-full max-w-[590px]" />
          </div>
        </div>
      </section>

      <section
        id="experience"
        className="relative isolate overflow-hidden py-16 sm:py-20 lg:py-24"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_78%_52%,rgba(199,166,243,0.34),transparent_38%),linear-gradient(110deg,#ffffff_0%,#fcf8ff_58%,#f3eaff_100%)]"
        />

        <div className="container-shell grid items-center gap-10 lg:grid-cols-[1fr_1fr] lg:gap-8">
          <div className="relative z-10 min-w-0">
            <p className="eyebrow mb-4">Why be here</p>
            <h2 className="editorial max-w-[600px] text-5xl leading-[.98] sm:text-6xl">
              More than an event.<br />
              <span className="text-purple-gradient italic">A place to begin.</span>
            </h2>

            <div className="mt-10 space-y-8 sm:mt-12 sm:space-y-9">
              {highlights.map((item, index) => {
                const Icon = item.icon;
                return (
                  <article
                    key={item.title}
                    className="reveal-on-scroll flex min-w-0 items-center gap-4 sm:gap-6"
                  >
                    <span className="inline-flex size-[64px] shrink-0 items-center justify-center rounded-[1.35rem] bg-[#eadcfb]/80 text-[#5f2295] sm:size-[76px] [&>svg]:block [&>svg]:shrink-0">
                      <Icon size={30} strokeWidth={1.8} />
                    </span>
                    <div className="min-w-0">
                      <p className="eyebrow mb-1">0{index + 1}</p>
                      <h3 className="editorial text-2xl leading-tight text-[#220749] sm:text-[1.7rem]">
                        {item.title}
                      </h3>
                      <p className="mt-1 max-w-[390px] text-sm leading-6 text-[#5f5271] sm:text-[15px]">
                        {item.text}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          <div className="relative mx-auto flex w-full min-w-0 items-center justify-center lg:justify-end">
            <Image
              src="/build-with-ai-illustration.webp"
              alt="A student thinking through ideas while working at a laptop"
              width={980}
              height={980}
              sizes="(min-width: 1024px) 50vw, 90vw"
              className="block h-auto w-full max-w-[620px] object-contain"
            />
          </div>
        </div>
      </section>

      <section id="schedule" className="container-shell py-20 sm:py-24">
        <div className="mb-12">
          <p className="eyebrow mb-4">The journey</p>
          <h2 className="editorial text-5xl sm:text-6xl">
            Three days. <span className="text-purple-gradient italic">Three chapters.</span>
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {days.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.day} className="card-hover reveal-on-scroll flex min-h-[300px] flex-col p-5 sm:min-h-[340px] sm:p-8">
                <div className="mb-10 flex items-center justify-between">
                  <span className="editorial text-6xl text-[#d8c5ee]">{item.day}</span>
                  <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#f4effc] text-[#5f2295] [&>svg]:block [&>svg]:shrink-0">
                    <Icon size={22} strokeWidth={1.8} />
                  </span>
                </div>
                <p className="eyebrow mb-3">{item.label}</p>
                <h3 className="editorial text-3xl text-[#220749]">{item.title}</h3>
                <p className="mt-4 text-sm leading-6 text-[#76678a]">{item.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      {/* Separate light lavender CTA panel; all text stays high-contrast */}
      <section id="about" className="hero-shell py-5 sm:py-8">
        <div className="cta-panel card-hover reveal-on-scroll grid items-center gap-6 px-5 py-7 sm:gap-7 sm:px-10 sm:py-10 lg:grid-cols-[1fr_auto] lg:px-12 lg:py-11">
          <div className="relative z-10">
            <p className="cta-label eyebrow mb-3">YOUR MOVE</p>
            <h2 className="editorial max-w-[1120px] text-[clamp(2.2rem,7vw,4rem)] leading-[1.02] text-[#220749]">
              The next big thing <span className="text-purple-gradient italic">could start with you.</span>
            </h2>
            <p className="cta-muted mt-4 max-w-[600px] text-sm leading-6 sm:text-base">
              Bring a question. Leave with a prototype, a new perspective or a team that keeps building.
            </p>
          </div>
          <a href={ctaHref} className="cta-button relative z-10 inline-flex items-center justify-center rounded-full bg-white px-8 py-4 text-sm font-bold text-[#5f2295] shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-xl">
            {ctaLabel}
          </a>
        </div>
      </section>

      <footer className="container-shell flex flex-col justify-between gap-4 py-8 text-xs text-[#8d7ba3] sm:flex-row sm:items-center">
        <span>© 2026 GenXCode. Built for the curious.</span>
        <span className="tracking-[.14em]">LEARN. BUILD. PITCH.</span>
      </footer>
    </main>
  );
}
