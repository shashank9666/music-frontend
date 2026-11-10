import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Music",
  description: "Interactive Programmable Sheet Music & Real-time Web Synthesizer",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-[#09090b] text-zinc-100" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
