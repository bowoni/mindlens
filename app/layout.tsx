import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://mindlens.app";

export const metadata: Metadata = {
  title: {
    default: "MindLens",
    template: "%s | MindLens",
  },
  description: "문서도, 영상도 — 모든 콘텐츠를 이해하는 AI. PDF, YouTube 영상을 업로드하고 AI와 대화하며 핵심을 파악하세요.",
  keywords: ["AI 문서 분석", "AI 영상 분석", "PDF 분석", "YouTube 분석", "AI Q&A"],
  metadataBase: new URL(baseUrl),
  openGraph: {
    type: "website",
    siteName: "MindLens",
    title: "MindLens — 모든 콘텐츠를 이해하는 AI",
    description: "PDF, YouTube 영상을 업로드하고 AI와 대화하며 핵심을 파악하세요.",
    url: baseUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "MindLens — 모든 콘텐츠를 이해하는 AI",
    description: "PDF, YouTube 영상을 업로드하고 AI와 대화하며 핵심을 파악하세요.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={geist.variable} suppressHydrationWarning>
      <body className="min-h-screen flex flex-col antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
