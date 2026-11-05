import { redirect } from "next/navigation";
import { GoogleAuthButton } from "@/components/google-auth-button";

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  if (process.env.LOCAL_DEV_BYPASS === "true") redirect("/register");
  const params = await searchParams;
  const requested = params.next ?? "/checkout";
  const nextPath = requested.startsWith("/") && !requested.startsWith("//")
    ? requested
    : "/checkout";

  return (
    <main className="grid min-h-screen place-items-center bg-[#fafaf7] px-5 py-12">
      <section className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 grid size-12 place-items-center rounded-2xl bg-[#1a56db] text-lg font-bold text-white">
          GX
        </div>
        <p className="eyebrow mb-4">GENXCODE TECH FEST 2026</p>
        <h1 className="editorial text-5xl leading-none">Your next chapter.</h1>
        <p className="mt-4 mb-9 text-sm leading-6 text-[#697386]">
          Continue with your Google account to access the GenXCode Tech Fest.
        </p>
        <GoogleAuthButton nextPath={nextPath} />
      </section>
    </main>
  );
}
