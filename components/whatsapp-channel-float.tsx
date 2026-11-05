import { ExternalLink, MessageCircle } from "lucide-react";

export function WhatsAppChannelFloat({ url }: { url: string | null }) {
  if (!url) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Join the official GenXCode WhatsApp Channel"
      title="Join the official GenXCode WhatsApp Channel"
      className="group fixed bottom-5 right-5 z-50 inline-flex h-14 w-14 items-center justify-center gap-2 rounded-full bg-[#168a45] px-4 text-white shadow-lg shadow-green-900/20 transition-all duration-200 hover:bg-[#11763a] hover:shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-green-200 sm:bottom-8 sm:right-8 sm:h-auto sm:w-auto sm:justify-start sm:px-5 sm:py-3.5"
    >
      <MessageCircle size={23} className="shrink-0" />
      <span className="hidden whitespace-nowrap text-sm font-semibold sm:inline">
        Join WhatsApp Channel
      </span>
      <ExternalLink size={15} className="hidden shrink-0 opacity-80 sm:inline" />
    </a>
  );
}
