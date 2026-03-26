"use client";

import { useRef, useState } from "react";

type Props = {
  analysisType: string;
  content: Record<string, unknown>;
};

function generateMarkdown(type: string, content: Record<string, unknown>): string {
  const lines: string[] = [];

  if (type === "document" || type === "video") {
    const c = content as {
      title: string; summary: string; keywords: string[];
      sections: { heading: string; content: string }[];
      insights: string[];
      videoId?: string; videoTitle?: string; videoPublishedAt?: string;
    };

    lines.push(`# ${c.title}`);
    lines.push("");

    if (c.videoId) {
      lines.push(`> YouTube: https://www.youtube.com/watch?v=${c.videoId}`);
      lines.push("");
    }

    lines.push("## 요약");
    lines.push(c.summary);
    lines.push("");

    if (c.keywords?.length) {
      lines.push("## 키워드");
      lines.push(c.keywords.map((k) => `\`${k}\``).join(" "));
      lines.push("");
    }

    if (c.sections?.length) {
      lines.push("## 섹션별 분석");
      c.sections.forEach((sec) => {
        lines.push(`### ${sec.heading}`);
        lines.push(sec.content);
        lines.push("");
      });
    }

    if (c.insights?.length) {
      lines.push("## 주목할 인사이트");
      c.insights.forEach((ins, i) => {
        lines.push(`${i + 1}. ${ins}`);
      });
      lines.push("");
    }
  } else if (type === "comparison") {
    const c = content as {
      title: string; summary: string;
      commonalities: string[];
      differences: { aspect: string; details: string }[];
      insights: string[]; recommendation: string;
    };

    lines.push(`# ${c.title}`);
    lines.push("");
    lines.push("## 요약");
    lines.push(c.summary);
    lines.push("");

    if (c.commonalities?.length) {
      lines.push("## 공통점");
      c.commonalities.forEach((item, i) => {
        lines.push(`${i + 1}. ${item}`);
      });
      lines.push("");
    }

    if (c.differences?.length) {
      lines.push("## 차이점");
      c.differences.forEach((diff) => {
        lines.push(`### ${diff.aspect}`);
        lines.push(diff.details);
        lines.push("");
      });
    }

    if (c.insights?.length) {
      lines.push("## 종합 인사이트");
      c.insights.forEach((ins, i) => {
        lines.push(`${i + 1}. ${ins}`);
      });
      lines.push("");
    }

    if (c.recommendation) {
      lines.push("## 추천");
      lines.push(c.recommendation);
      lines.push("");
    }
  }

  lines.push("---");
  lines.push(`*MindLens로 분석됨 — ${new Date().toLocaleDateString("ko-KR")}*`);

  return lines.join("\n");
}

function downloadMarkdown(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ExportButton({ analysisType, content }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  function handleMarkdown() {
    const title = (content.title as string) ?? "분석";
    const md = generateMarkdown(analysisType, content);
    const filename = `${title.slice(0, 40).replace(/[/\\?%*:|"<>]/g, "-")}.md`;
    downloadMarkdown(filename, md);
    setOpen(false);
  }

  function handlePdf() {
    setOpen(false);
    setTimeout(() => window.print(), 100);
  }

  return (
    <div className="relative print:hidden" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        내보내기
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-7 z-20 w-40 rounded-lg border border-border bg-background shadow-lg py-1">
            <button
              onClick={handleMarkdown}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              Markdown
            </button>
            <button
              onClick={handlePdf}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
              PDF
            </button>
          </div>
        </>
      )}
    </div>
  );
}
