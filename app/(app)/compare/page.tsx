"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import RecentAnalysesSidebar from "@/components/recent-analyses-sidebar";

type Analysis = {
  id: string;
  type: string;
  title: string;
  created_at: string;
};

export default function ComparePage() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("analyses")
      .select("id, type, title, created_at")
      .in("type", ["document", "video"])
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setAnalyses(data ?? []);
        setLoading(false);
      });
  }, []);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev; // 최대 3개
      return [...prev, id];
    });
  }

  async function handleCompare() {
    if (selected.length < 2) return;
    setComparing(true);
    setError(null);

    const res = await fetch("/api/compare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selected }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "비교 분석에 실패했습니다.");
      setComparing(false);
      return;
    }

    router.push(`/compare/${data.id}`);
  }

  const typeLabel = (type: string) =>
    type === "video" ? "영상" : "문서";

  const typeBadgeClass = (type: string) =>
    type === "video"
      ? "border-amber-500/20 bg-amber-500/10 text-amber-500"
      : "border-border text-muted-foreground";

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">비교 분석</h1>
        <p className="text-sm text-muted-foreground mt-1">
          2~3개의 분석을 선택하면 AI가 공통점과 차이점을 분석해드려요.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-10">
      <div className="min-w-0">
      {/* 선택 상태 표시 */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {selected.length === 0
            ? "비교할 분석을 선택해주세요 (2~3개)"
            : `${selected.length}개 선택됨`}
        </p>
        <button
          onClick={handleCompare}
          disabled={selected.length < 2 || comparing}
          className="h-9 px-4 rounded-lg bg-accent hover:bg-(--accent-hover) disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
        >
          {comparing ? "분석 중..." : "비교 시작"}
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg px-3 py-2.5 mb-4">
          {error}
        </p>
      )}

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl border border-border bg-muted animate-pulse" />
          ))}
        </div>
      ) : analyses.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-muted-foreground">분석 기록이 없습니다.</p>
          <p className="text-xs text-muted-foreground mt-1">문서나 영상을 먼저 분석해주세요.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {analyses.map((a) => {
            const isSelected = selected.includes(a.id);
            const isDisabled = !isSelected && selected.length >= 3;
            return (
              <button
                key={a.id}
                onClick={() => !isDisabled && toggleSelect(a.id)}
                disabled={isDisabled}
                className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
                  isSelected
                    ? "border-accent bg-(--accent-subtle)"
                    : isDisabled
                    ? "border-border bg-card opacity-40 cursor-not-allowed"
                    : "border-border bg-card hover:border-accent/50"
                }`}
              >
                {/* 체크박스 */}
                <div
                  className={`shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                    isSelected ? "border-accent bg-accent" : "border-border"
                  }`}
                >
                  {isSelected && (
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="white">
                      <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>

                {/* 배지 */}
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border shrink-0 ${typeBadgeClass(a.type)}`}>
                  {typeLabel(a.type)}
                </span>

                {/* 제목 */}
                <p className="flex-1 text-sm font-medium text-foreground truncate">{a.title}</p>

                {/* 날짜 */}
                <span className="text-xs text-muted-foreground shrink-0">
                  {new Date(a.created_at).toLocaleDateString("ko-KR")}
                </span>
              </button>
            );
          })}
        </div>
      )}
      </div>
      <RecentAnalysesSidebar type="comparison" title="최근 비교 분석" />
      </div>
    </div>
  );
}
