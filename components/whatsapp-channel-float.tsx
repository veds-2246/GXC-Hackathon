import { MessageCircle } from "lucide-react";

export function WhatsAppChannelFloat({ url }: { url: string | null }) {
  if (!url) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Join the official GenXCode WhatsApp Channel"
      title="Join the official GenXCode WhatsApp Channel"
      style={{ bottom: "calc(1rem + env(safe-area-inset-bottom))", right: "calc(1rem + env(safe-area-inset-right))" }}
      className="group fixed z-50 inline-flex h-14 w-14 min-w-14 items-center justify-center gap-2 rounded-full bg-[#168a45] px-4 text-white shadow-lg shadow-green-900/20 transition-all duration-200 hover:bg-[#11763a] hover:shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-green-200 sm:h-auto sm:w-auto sm:justify-start sm:px-5 sm:py-3.5"
    >
      <MessageCircle size={23} className="shrink-0" />
      <span className="hidden whitespace-nowrap text-sm font-semibold sm:inline">
        Join WhatsApp Channel
      </span>
    </a>
  );
}
