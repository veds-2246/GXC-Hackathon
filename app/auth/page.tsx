import { BrandLockup } from "@/components/brand-lockup";
import { GoogleAuthButton } from "@/components/google-auth-button";

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const requested = params.next ?? "/checkout";
  const nextPath = requested.startsWith("/") && !requested.startsWith("//")
    ? requested
    : "/checkout";

  return (
    <main className="grid min-h-screen place-items-center bg-[#fafaf7] px-5 py-12">
      <section className="surface-glass-panel card-hover w-full max-w-md rounded-[2rem] p-8 text-center sm:p-10">
        <BrandLockup className="mx-auto mb-8 items-center" />
        <h1 className="editorial text-5xl leading-none">Your next chapter.</h1>
        <p className="mt-4 mb-9 text-sm leading-6 text-[#697386]">
          Continue with your Google account to access the GenXCode Hackathon.
        </p>
        <GoogleAuthButton nextPath={nextPath} />
      </section>
    </main>
  );
}
