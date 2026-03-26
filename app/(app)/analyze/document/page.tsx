"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import RecentAnalysesSidebar from "@/components/recent-analyses-sidebar";

type DomainConfig = { key: string; label: string; description: string };

export default function DocumentAnalyzePage() {
  const [domains, setDomains] = useState<DomainConfig[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [domain, setDomain] = useState("");
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const maxFileSizeMB = Number(process.env.NEXT_PUBLIC_MAX_FILE_SIZE_MB ?? 20);

  useEffect(() => {
    fetch("/api/domains")
      .then((r) => r.json())
      .then((data: DomainConfig[]) => {
        setDomains(data);
        if (data.length > 0) setDomain(data[0].key);
      });
  }, []);

  function handleFile(f: File) {
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (ext !== "pdf" && ext !== "docx") {
      setError("PDF 또는 DOCX 파일만 지원합니다.");
      return;
    }
    if (f.size > maxFileSizeMB * 1024 * 1024) {
      setError(`파일 크기는 ${maxFileSizeMB}MB 이하여야 합니다.`);
      return;
    }
    setError(null);
    setFile(f);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("domain", domain);

    const res = await fetch("/api/analyze/document", { method: "POST", body: formData });

    let data: { id?: string; error?: string } = {};
    try {
      data = await res.json();
    } catch {
      setError("서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
      setLoading(false);
      return;
    }

    if (!res.ok) {
      setError(data.error ?? "분석 중 오류가 발생했습니다.");
      setLoading(false);
      return;
    }

    router.push(`/analyze/document/${data.id}`);
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">문서 분석</h1>
        <p className="text-sm text-muted-foreground mt-1">
          PDF 또는 DOCX 파일을 업로드하면 AI가 핵심 내용을 분석해드려요.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-10">
      <form onSubmit={handleSubmit} className="space-y-6 min-w-0">
        {/* 파일 업로드 영역 */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          onClick={() => inputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-12 cursor-pointer transition-colors ${
            dragging || file
              ? "border-accent bg-(--accent-subtle)"
              : "border-border hover:border-accent hover:bg-muted"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />

          {file ? (
            <>
              <div className="w-10 h-10 rounded-lg bg-accent text-white flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">{file.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                className="text-xs text-muted-foreground hover:text-foreground underline"
              >
                파일 변경
              </button>
            </>
          ) : (
            <>
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
                  <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
                </svg>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">파일을 드래그하거나 클릭해서 선택</p>
                <p className="text-xs text-muted-foreground mt-0.5">PDF, DOCX · 최대 {maxFileSizeMB}MB</p>
              </div>
            </>
          )}
        </div>

        {/* 도메인 선택 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">분석 모드</label>
          {domains.length === 0 ? (
            <div className="h-12 rounded-lg bg-muted animate-pulse" />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {domains.map((d) => (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => setDomain(d.key)}
                  className={`flex flex-col items-center gap-0.5 rounded-lg border px-3 py-2.5 text-xs transition-colors ${
                    domain === d.key
                      ? "border-accent bg-(--accent-subtle) text-accent font-medium"
                      : "border-border text-muted-foreground hover:border-accent hover:text-foreground"
                  }`}
                >
                  <span className="font-medium">{d.label}</span>
                  <span className="opacity-70">{d.description}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg px-3 py-2.5">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={!file || !domain || loading}
          className="w-full h-10 rounded-lg bg-accent hover:bg-(--accent-hover) disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              분석 중...
            </>
          ) : "분석 시작"}
        </button>
      </form>
      <RecentAnalysesSidebar type="document" title="최근 문서 분석" />
      </div>
    </div>
  );
}
