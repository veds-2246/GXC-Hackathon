"use client";

import { useState, type ReactNode } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";

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
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50"
      >
        <Trash2 size={15} />
        {label}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0b0f19]/55 px-4 py-6 backdrop-blur-[3px]"
          role="presentation"
          onClick={() => setOpen(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-delete-title"
            aria-describedby="admin-delete-description"
            className="w-full max-w-md rounded-2xl border border-[#e4e4dd] bg-white p-6 shadow-2xl shadow-black/20 sm:p-7"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="grid size-12 place-items-center rounded-2xl bg-red-50 text-red-600">
                <AlertTriangle size={23} />
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close confirmation"
                className="rounded-full p-2 text-[#697386] transition hover:bg-[#f3f4f6] hover:text-[#111827]"
              >
                <X size={18} />
              </button>
            </div>

            <h2 id="admin-delete-title" className="editorial mt-5 text-3xl text-[#111827]">
              Confirm deletion
            </h2>
            <p id="admin-delete-description" className="mt-3 text-sm leading-6 text-[#697386]">
              {confirmMessage}
            </p>

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-[#dfe3ea] px-5 py-3 text-sm font-semibold text-[#374151] transition hover:bg-[#f7f8fa]"
              >
                Cancel
              </button>
              <form action={action}>
                {children}
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#d93025] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#b3261e] sm:w-auto"
                >
                  <Trash2 size={15} />
                  Yes, delete
                </button>
              </form>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
