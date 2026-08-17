import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/nav";
import { ProgressProvider } from "@/components/progress";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Callback — tech interview prep",
    template: "%s · Callback",
  },
  description:
    "Coding, system design, behavioral, and company-specific interview prep for engineers — practice until the phone rings.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <ProgressProvider>
          <Nav />
          <main className="w-full flex-1">{children}</main>
        </ProgressProvider>
        <footer className="border-t border-zinc-800">
          <div className="mx-auto w-full max-w-5xl px-4 py-6 text-xs text-zinc-500">
            Callback — interview prep for engineers.
          </div>
        </footer>
      </body>
    </html>
  );
}
