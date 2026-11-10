import { BrandLockup } from "@/components/brand-lockup";

type PageSkeletonProps = {
  variant?: "landing" | "dashboard" | "admin" | "operations" | "form";
};

function SkeletonBlock({ className = "" }: { className?: string }) {
  return <span aria-hidden="true" className={`skeleton-shimmer block rounded-xl ${className}`} />;
}

export function PageSkeleton({ variant = "dashboard" }: PageSkeletonProps) {
  const isLanding = variant === "landing";
  const isAdmin = variant === "admin" || variant === "operations";
  const isForm = variant === "form";

  return (
    <main aria-busy="true" aria-label="Loading page" className="min-h-screen">
      <div className="container-shell pt-3">
        <header className="surface-glass-nav flex min-h-[68px] items-center justify-between gap-4 rounded-2xl px-4 py-3 sm:min-h-[76px] sm:px-6">
          <BrandLockup />
          <div className="hidden items-center gap-3 sm:flex">
            <SkeletonBlock className="h-9 w-24 rounded-full" />
            <SkeletonBlock className="h-9 w-28 rounded-full" />
            <SkeletonBlock className="h-9 w-24 rounded-full" />
          </div>
          <SkeletonBlock className="h-10 w-24 rounded-full sm:hidden" />
        </header>
      </div>

      <section className={isLanding ? "hero-shell py-12 sm:py-16" : "container-shell py-12 sm:py-16"}>
        <div className="mb-8 space-y-4">
          <SkeletonBlock className="h-3 w-32" />
          <SkeletonBlock className="h-10 w-3/4 max-w-2xl sm:h-14" />
          <SkeletonBlock className="h-4 w-full max-w-xl" />
          <SkeletonBlock className="h-4 w-2/3 max-w-lg" />
        </div>

        {isLanding ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <SkeletonBlock className="min-h-[280px] rounded-[2rem] sm:min-h-[420px]" />
            <SkeletonBlock className="min-h-[280px] rounded-[2rem] sm:min-h-[420px]" />
          </div>
        ) : isForm ? (
          <div className="card-hover space-y-5 rounded-3xl p-5 sm:p-8">
            <SkeletonBlock className="h-8 w-1/2" />
            <SkeletonBlock className="h-12 w-full" />
            <SkeletonBlock className="h-12 w-full" />
            <SkeletonBlock className="h-28 w-full" />
            <SkeletonBlock className="h-11 w-36 rounded-full" />
          </div>
        ) : (
          <>
            <div className={`grid gap-4 sm:grid-cols-2 ${isAdmin ? "xl:grid-cols-3" : "lg:grid-cols-2"}`}>
              {Array.from({ length: isAdmin ? 6 : 4 }, (_, index) => (
                <div key={index} className="card-hover space-y-5 rounded-2xl p-5 sm:p-7">
                  <div className="flex items-center justify-between">
                    <SkeletonBlock className="h-3 w-28" />
                    <SkeletonBlock className="size-10 rounded-xl" />
                  </div>
                  <SkeletonBlock className="h-8 w-2/3" />
                  <SkeletonBlock className="h-4 w-full" />
                  <SkeletonBlock className="h-4 w-4/5" />
                  {isAdmin && <SkeletonBlock className="h-10 w-32 rounded-full" />}
                </div>
              ))}
            </div>
            <div className="mt-6 card-hover space-y-4 rounded-2xl p-5 sm:p-7">
              <SkeletonBlock className="h-7 w-1/3" />
              <SkeletonBlock className="h-28 w-full" />
              <SkeletonBlock className="h-4 w-5/6" />
            </div>
          </>
        )}
      </section>
      <span className="sr-only">Loading content. Please wait.</span>
    </main>
  );
}
