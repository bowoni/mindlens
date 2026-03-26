"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";

type Analysis = {
  id: string;
  type: string;
  title: string;
  domain: string | null;
  created_at: string;
};

type TeamAnalysis = {
  id: string;
  analysis_id: string;
  added_by: string;
  created_at: string;
  is_starred: boolean;
  analyses: Analysis;
};

const TYPE_LABEL: Record<string, string> = {
  document: "문서",
  video: "영상",
  comparison: "비교",
};

const TYPE_HREF: Record<string, string> = {
  document: "/analyze/document",
  video: "/analyze/video",
  comparison: "/compare",
};

const ROLE_LABEL: Record<string, string> = {
  owner: "Leader",
  admin: "Admin",
  contributor: "Member",
  viewer: "Viewer",
};

const PAGE_SIZE = 12;

export default function TeamPage() {
  const [items, setItems] = useState<TeamAnalysis[]>([]);
  const [role, setRole] = useState<string | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [teamName, setTeamName] = useState<string | null>(null);

  const [filter, setFilter] = useState<"all" | "starred">("all");
  const [page, setPage] = useState(1);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  const canDelete = role && ["owner", "admin"].includes(role);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const [analysesRes, teamRes] = await Promise.all([
        fetch("/api/team/analyses").then((r) => r.json()),
        fetch("/api/team").then((r) => r.json()),
      ]);
      setItems(analysesRes.analyses ?? []);
      setRole(analysesRes.role);
      setTeamId(analysesRes.teamId);
      setTeamName(teamRes.team?.name ?? null);
      setLoading(false);
    })();
  }, []);

  function toggleStar(item: TeamAnalysis) {
    const next = !item.is_starred;
    setItems((prev) =>
      prev
        .map((i) => (i.id === item.id ? { ...i, is_starred: next } : i))
        .sort((a, b) => {
          if (a.is_starred !== b.is_starred) return a.is_starred ? -1 : 1;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        })
    );
    fetch("/api/team/analyses", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamAnalysisId: item.id, starred: next }),
    });
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  }

  function exitSelectMode() {
    setSelectMode(false);
    setSelected(new Set());
  }

  function handleBulkDelete() {
    if (selected.size === 0) return;
    if (!confirm(`선택한 ${selected.size}개를 팀 대시보드에서 제거하시겠습니까?`)) return;
    startTransition(async () => {
      await Promise.all(
        Array.from(selected).map((analysisId) =>
          fetch(`/api/team/analyses?analysisId=${analysisId}`, { method: "DELETE" })
        )
      );
      setItems((prev) => prev.filter((i) => !selected.has(i.analysis_id)));
      exitSelectMode();
    });
  }

  const filtered = filter === "starred" ? items.filter((i) => i.is_starred) : items;
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function changeFilter(f: "all" | "starred") {
    setFilter(f);
    setPage(1);
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-3 animate-pulse">
        <div className="h-7 bg-muted rounded w-40" />
        <div className="h-4 bg-muted rounded w-24" />
      </div>
    );
  }

  if (!teamId) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-center space-y-4">
        <p className="text-muted-foreground text-sm">아직 팀이 없습니다.</p>
        <Link
          href="/team/settings"
          className="inline-block px-5 py-2.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-(--accent-hover) transition-colors"
        >
          팀 만들기
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">
            {teamName ?? "팀 대시보드"}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {role ? ROLE_LABEL[role] : ""} · {items.length}개 분석
          </p>
        </div>
      </div>

      {/* 권한 안내 */}
      {(role === "viewer" || role === "contributor") && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-muted text-xs text-muted-foreground">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {role === "viewer"
            ? "Viewer 권한으로 조회만 가능합니다."
            : "Member 권한으로 개인 대시보드에서 분석을 팀에 추가할 수 있습니다."}
        </div>
      )}

      {/* 필터 + 선택 툴바 */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {(["all", "starred"] as const).map((f) => (
            <button
              key={f}
              onClick={() => changeFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                filter === f
                  ? "bg-(--accent-subtle) text-accent font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {f === "all" ? "전체" : "즐겨찾기"}
              <span className="ml-1.5 text-xs opacity-60">
                {f === "all" ? items.length : items.filter((i) => i.is_starred).length}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {selectMode ? (
            <>
              <span className="text-xs text-muted-foreground">{selected.size}개 선택</span>
              {canDelete && (
                <button
                  onClick={handleBulkDelete}
                  disabled={selected.size === 0 || isPending}
                  className="h-8 px-3 rounded-lg bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white text-xs font-medium transition-colors"
                >
                  {isPending ? "처리 중..." : "제거"}
                </button>
              )}
              <button
                onClick={exitSelectMode}
                className="h-8 px-3 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted text-xs transition-colors"
              >
                취소
              </button>
            </>
          ) : (
            <button
              onClick={() => setSelectMode(true)}
              className="h-8 px-3 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted text-xs transition-colors"
            >
              선택
            </button>
          )}
        </div>
      </div>

      {/* 분석 목록 */}
      <section className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <p className="text-sm text-muted-foreground">
              {filter === "starred" ? "즐겨찾기한 분석이 없습니다." : "팀 대시보드에 추가된 분석이 없습니다."}
            </p>
            {filter === "all" && role && ["owner", "admin", "contributor"].includes(role) && (
              <Link href="/dashboard" className="inline-block text-sm text-accent hover:underline">
                개인 대시보드에서 추가하기 →
              </Link>
            )}
          </div>
        ) : (
          <>
            {paginated.map((item) => {
              const a = item.analyses;
              const isSelected = selected.has(item.analysis_id);
              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg border bg-card group transition-colors ${
                    isSelected ? "border-accent bg-(--accent-subtle)" : "border-border hover:border-accent/50"
                  }`}
                >
                  {selectMode && (
                    <button
                      onClick={() => toggleSelect(item.analysis_id)}
                      className={`shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        isSelected ? "border-accent bg-accent" : "border-border"
                      }`}
                    >
                      {isSelected && (
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>
                  )}
                  <Link
                    href={`${TYPE_HREF[a.type] ?? "/dashboard"}/${a.id}`}
                    className="flex items-center gap-3 flex-1 min-w-0"
                  >
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
                      a.type === "video"
                        ? "border border-amber-500/20 bg-amber-500/10 text-amber-500"
                        : a.type === "comparison"
                        ? "border border-purple-500/20 bg-purple-500/10 text-purple-500"
                        : "border border-border text-muted-foreground"
                    }`}>
                      {TYPE_LABEL[a.type] ?? a.type}
                    </span>
                    <span className="text-sm text-foreground font-medium flex-1 truncate">{a.title}</span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(a.created_at).toLocaleDateString("ko-KR")}
                    </span>
                  </Link>
                  {!selectMode && (
                    <button
                      onClick={() => toggleStar(item)}
                      className="shrink-0 w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-amber-400 transition-colors"
                      aria-label={item.is_starred ? "즐겨찾기 해제" : "즐겨찾기"}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill={item.is_starred ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={item.is_starred ? "text-amber-400" : ""}>
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                    </button>
                  )}
                  {!selectMode && canDelete && (
                    <button
                      onClick={() => {
                        if (!confirm("팀 대시보드에서 제거하시겠습니까?")) return;
                        fetch(`/api/team/analyses?analysisId=${item.analysis_id}`, { method: "DELETE" });
                        setItems((prev) => prev.filter((i) => i.id !== item.id));
                      }}
                      className="shrink-0 opacity-0 group-hover:opacity-100 text-xs text-red-500 hover:text-red-400 transition-all"
                    >
                      제거
                    </button>
                  )}
                </div>
              );
            })}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1 pt-4">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6"/>
                  </svg>
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm transition-colors ${
                      p === page
                        ? "bg-accent text-white font-medium"
                        : "border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
