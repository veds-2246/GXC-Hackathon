import type { Metadata } from "next";
import "./globals.css";
import { ScrollEffects } from "@/components/scroll-effects";

export const metadata: Metadata = {
  title: "GenXCode Hackathon | Build What Matters",
  description:
    "Three days of learning, building and pitching. Join the GenXCode Hackathon.",
  icons: { icon: "/genxcode-mark.webp", shortcut: "/genxcode-mark.webp" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body><ScrollEffects />{children}</body>
    </html>
  );
}
