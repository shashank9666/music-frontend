import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NoteScript Studio - Programmable Sheet Music",
  description: "Code musical notes, loops, and chords as building blocks with live sheet rendering and synthesizer.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100">{children}</body>
    </html>
  );
}
