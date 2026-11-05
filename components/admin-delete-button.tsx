"use client";

import type { FormEvent, ReactNode } from "react";
import { Trash2 } from "lucide-react";

type DeleteAction = (formData: FormData) => void | Promise<void>;

export function AdminDeleteButton({
  action,
  confirmMessage,
  label = "Delete",
  children,
}: {
  action: DeleteAction;
  confirmMessage: string;
  label?: string;
  children?: ReactNode;
}) {
  function confirmSubmit(event: FormEvent<HTMLFormElement>) {
    if (!window.confirm(confirmMessage)) event.preventDefault();
  }

  return (
    <form action={action} onSubmit={confirmSubmit}>
      {children}
      <button
        type="submit"
        className="inline-flex items-center gap-2 rounded-full border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50"
      >
        <Trash2 size={15} />
        {label}
      </button>
    </form>
  );
}
