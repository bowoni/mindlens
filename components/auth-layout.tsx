import { LensIcon, LogoFull } from "@/components/logo";
import type { ReactNode } from "react";

const FEATURES = [
  { label: "문서 분석", desc: "PDF·DOCX를 AI가 요약·분석" },
  { label: "영상 분석", desc: "YouTube 자막 기반 인사이트 추출" },
  { label: "비교 분석", desc: "여러 콘텐츠의 공통점·차이점 비교" },
  { label: "AI 질문", desc: "분석 내용 기반 맥락 있는 답변" },
];

type AuthLayoutProps = {
  heading: ReactNode;
  subtext: string;
  children: ReactNode;
};

export default function AuthLayout({ heading, subtext, children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex bg-background">
      {/* 왼쪽 브랜드 패널 — 데스크탑만 */}
      <div className="hidden lg:flex flex-col w-1/2 bg-accent px-12 py-10">
        <div className="flex items-center gap-3">
          <LensIcon size={32} className="text-white/80" />
          <span className="font-semibold text-white text-2xl tracking-tight">MindLens</span>
        </div>

        <div className="flex-1 flex items-center">
          <div className="space-y-10 w-full">
            <div>
              <h2 className="text-3xl font-semibold text-white leading-snug">{heading}</h2>
              <p className="text-white/70 text-sm mt-3 leading-relaxed">{subtext}</p>
            </div>

            <ul className="space-y-4">
              {FEATURES.map((f) => (
                <li key={f.label} className="flex items-start gap-3">
                  <span className="mt-0.5 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                  <div>
                    <p className="text-sm font-medium text-white">{f.label}</p>
                    <p className="text-xs text-white/60">{f.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* 오른쪽 폼 패널 */}
      <div className="flex-1 flex flex-col">
        <header className="flex items-center px-6 py-4 lg:hidden">
          <LogoFull />
        </header>
        <main className="flex-1 flex items-center justify-center px-6 py-12">
          {children}
        </main>
      </div>
    </div>
  );
}
