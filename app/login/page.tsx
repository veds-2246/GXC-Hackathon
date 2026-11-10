import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const requested = params.next ?? "/register";
  const nextPath = requested.startsWith("/") && !requested.startsWith("//")
    ? requested
    : "/register";

  redirect(`/auth?next=${encodeURIComponent(nextPath)}`);
}
