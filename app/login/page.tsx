import { AuthForm } from "@/components/auth-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const requested = params.next ?? "/checkout";
  const nextPath = requested.startsWith("/") && !requested.startsWith("//") ? requested : "/checkout";
  return <main className="grid min-h-screen place-items-center bg-[#fafaf7] px-5 py-12"><AuthForm mode="login" nextPath={nextPath} /></main>;
}
