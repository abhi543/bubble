import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bubble Pop Adventure — a happy game for kids",
  description: "A colorful, kid-friendly arcade game for ages 5–10. Pop silly smiling monsters with bubbles and stars — no violence, just confetti and sparkles!",
  keywords: ["Bubble Pop", "Kids Game", "Arcade", "Next.js", "TypeScript", "Tailwind CSS", "React"],
  authors: [{ name: "Bubble Pop Team" }],
  icons: {
    icon: "/bubble.svg",
    shortcut: "/bubble.svg",
    apple: "/bubble.svg",
  },
  openGraph: {
    title: "Bubble Pop Adventure",
    description: "A colorful, kid-friendly arcade game for ages 5–10.",
    siteName: "Bubble Pop Adventure",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
