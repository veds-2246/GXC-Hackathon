"use client";

import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";

export function PendingSubmitButton({
  children,
  pendingLabel = "Saving…",
  className = "",
  disabled = false,
}: {
  children: ReactNode;
  pendingLabel?: string;
  className?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      aria-live="polite"
      aria-busy={pending}
      className={`inline-flex items-center justify-center gap-2 transition disabled:cursor-wait disabled:opacity-65 ${className}`}
    >
      {pending ? <><LoaderCircle size={16} className="animate-spin" />{pendingLabel}</> : children}
    </button>
  );
}
