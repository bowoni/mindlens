"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toggleStar, deleteAnalyses, starAnalyses } from "@/app/(app)/dashboard/actions";

type Analysis = {
  id: string;
  type: string;
  title: string;
  domain: string;
  is_starred: boolean;
  created_at: string;
};

const TYPE_FILTERS = [
  { key: "all", label: "전체" },
  { key: "document", label: "문서" },
  { key: "video", label: "영상" },
  { key: "comparison", label: "비교" },
  { key: "starred", label: "즐겨찾기" },
];

const TYPE_LABELS: Record<string, string> = {
  document: "문서",
  video: "영상",
  comparison: "비교",
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  document: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>
  ),
  video: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
    </svg>
  ),
  comparison: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
};

function AnalysisCard({
  analysis,
  starred,
  onToggleStar,
  selectMode,
  selected,
  onToggleSelect,
  teamContext,
}: {
  analysis: Analysis;
  starred: boolean;
  onToggleStar: (id: string, current: boolean) => void;
  selectMode: boolean;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  teamContext?: { role: string; addedIds: Set<string> };
}) {
  const [isPending, startTransition] = useTransition();
  const [addedToTeam, setAddedToTeam] = useState(
    () => teamContext?.addedIds.has(analysis.id) ?? false
  );
  const [addingToTeam, setAddingToTeam] = useState(false);

  const canAddToTeam = teamContext && ["owner", "admin", "contributor"].includes(teamContext.role);

  const href =
    analysis.type === "document"
      ? `/analyze/document/${analysis.id}`
      : analysis.type === "video"
      ? `/analyze/video/${analysis.id}`
      : `/compare/${analysis.id}`;

  function handleStar(e: React.MouseEvent) {
    e.preventDefault();
    startTransition(() => toggleStar(analysis.id, starred));
    onToggleStar(analysis.id, starred);
  }

  async function handleAddToTeam(e: React.MouseEvent) {
    e.preventDefault();
    if (addedToTeam || addingToTeam) return;
    setAddingToTeam(true);
    await fetch("/api/team/analyses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ analysisId: analysis.id }),
    });
    setAddedToTeam(true);
    setAddingToTeam(false);
  }

  if (selectMode) {
    return (
      <button
        onClick={() => onToggleSelect(analysis.id)}
        className={`block w-full text-left rounded-xl border p-5 transition-all ${
          selected
            ? "border-accent bg-(--accent-subtle)"
            : "border-border bg-card hover:border-accent/50"
        }`}
      >
        <div className="flex items-start justify-between gap-2 mb-3">
          <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border ${
            analysis.type === "document"
              ? "bg-(--accent-subtle) text-accent border-accent/20"
              : analysis.type === "video"
              ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
              : "bg-purple-500/10 text-purple-500 border-purple-500/20"
          }`}>
            {TYPE_ICONS[analysis.type]}
            {TYPE_LABELS[analysis.type] ?? analysis.type}
          </span>
          <div className={`w-6 h-6 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
            selected ? "border-accent bg-accent" : "border-border"
          }`}>
            {selected && (
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
        </div>
        <h3 className="text-sm font-medium text-foreground line-clamp-2 mb-2">{analysis.title}</h3>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{analysis.domain}</span>
          <span className="text-xs text-muted-foreground">
            {new Date(analysis.created_at).toLocaleDateString("ko-KR")}
          </span>
        </div>
      </button>
    );
  }

  return (
    <Link
      href={href}
      className="group block rounded-xl border border-border bg-card p-5 hover:border-accent transition-colors"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border ${
          analysis.type === "document"
            ? "bg-(--accent-subtle) text-accent border-accent/20"
            : analysis.type === "video"
            ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
            : "bg-purple-500/10 text-purple-500 border-purple-500/20"
        }`}>
          {TYPE_ICONS[analysis.type]}
          {TYPE_LABELS[analysis.type] ?? analysis.type}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {canAddToTeam && (
            <button
              onClick={handleAddToTeam}
              disabled={addedToTeam || addingToTeam}
              className={`h-6 px-2 rounded text-xs font-medium transition-colors ${
                addedToTeam
                  ? "text-accent bg-(--accent-subtle) cursor-default"
                  : "text-muted-foreground hover:text-accent hover:bg-(--accent-subtle) disabled:opacity-50"
              }`}
              title={addedToTeam ? "팀 대시보드에 추가됨" : "팀 대시보드에 추가"}
            >
              {addedToTeam ? "추가됨" : addingToTeam ? "…" : "팀에 추가"}
            </button>
          )}
          <button
            onClick={handleStar}
            disabled={isPending}
            className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-amber-400 transition-colors disabled:opacity-50"
            aria-label={starred ? "즐겨찾기 해제" : "즐겨찾기"}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill={starred ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={starred ? "text-amber-400" : ""}>
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </button>
        </div>
      </div>
      <h3 className="text-sm font-medium text-foreground line-clamp-2 mb-2 group-hover:text-accent transition-colors">
        {analysis.title}
      </h3>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{analysis.domain}</span>
        <span className="text-xs text-muted-foreground">
          {new Date(analysis.created_at).toLocaleDateString("ko-KR")}
        </span>
      </div>
    </Link>
  );
}

const PAGE_SIZE = 12;

export default function DashboardGrid({
  analyses,
  teamContext,
}: {
  analyses: Analysis[];
  teamContext?: { role: string; addedIds: string[] };
}) {
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [starredIds, setStarredIds] = useState<Set<string>>(
    () => new Set(analyses.filter((a) => a.is_starred).map((a) => a.id))
  );

  const teamAddedIds = new Set(teamContext?.addedIds ?? []);

  function handleToggleStar(id: string, current: boolean) {
    setStarredIds((prev) => {
      const next = new Set(prev);
      if (current) { next.delete(id); } else { next.add(id); }
      return next;
    });
  }

  const base =
    filter === "starred" ? analyses.filter((a) => starredIds.has(a.id)) :
    filter === "all" ? analyses :
    analyses.filter((a) => a.type === filter);

  const filtered = filter === "starred"
    ? base
    : [...base].sort((a, b) => {
        const aS = starredIds.has(a.id);
        const bS = starredIds.has(b.id);
        return aS === bS ? 0 : aS ? -1 : 1;
      });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function exitSelectMode() {
    setSelectMode(false);
    setSelected(new Set());
  }

  function changeFilter(key: string) {
    setFilter(key);
    setPage(1);
  }

  function handleDelete() {
    if (selected.size === 0) return;
    startTransition(async () => {
      await deleteAnalyses(Array.from(selected));
      exitSelectMode();
    });
  }

  function handleBulkStar(star: boolean) {
    if (selected.size === 0) return;
    startTransition(async () => {
      await starAnalyses(Array.from(selected), star);
      exitSelectMode();
    });
  }

  const canAddToTeam = teamContext && ["owner", "admin", "contributor"].includes(teamContext.role);

  function handleBulkAddToTeam() {
    if (selected.size === 0 || !canAddToTeam) return;
    startTransition(async () => {
      await Promise.all(
        Array.from(selected).map((id) =>
          fetch("/api/team/analyses", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ analysisId: id }),
          })
        )
      );
      exitSelectMode();
    });
  }

  return (
    <div>
      {/* 필터 탭 + 선택/삭제 버튼 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-1">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => changeFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                filter === f.key
                  ? "bg-(--accent-subtle) text-accent font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {f.label}
              <span className="ml-1.5 text-xs opacity-60">
                {f.key === "all" ? analyses.length : f.key === "starred" ? analyses.filter((a) => a.is_starred).length : analyses.filter((a) => a.type === f.key).length}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {selectMode ? (
            <>
              <span className="text-xs text-muted-foreground">{selected.size}개 선택</span>
              <button
                onClick={() => handleBulkStar(true)}
                disabled={selected.size === 0 || isPending}
                className="h-8 px-3 rounded-lg border border-border text-muted-foreground hover:text-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-xs transition-colors"
                title="즐겨찾기 추가"
              >
                ★
              </button>
              <button
                onClick={() => handleBulkStar(false)}
                disabled={selected.size === 0 || isPending}
                className="h-8 px-3 rounded-lg border border-border text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed text-xs transition-colors"
                title="즐겨찾기 해제"
              >
                ☆
              </button>
              {canAddToTeam && (
                <button
                  onClick={handleBulkAddToTeam}
                  disabled={selected.size === 0 || isPending}
                  className="h-8 px-3 rounded-lg border border-border text-muted-foreground hover:text-accent hover:bg-(--accent-subtle) disabled:opacity-40 disabled:cursor-not-allowed text-xs transition-colors"
                >
                  팀에 추가
                </button>
              )}
              <button
                onClick={handleDelete}
                disabled={selected.size === 0 || isPending}
                className="h-8 px-3 rounded-lg bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-medium transition-colors"
              >
                {isPending ? "처리 중..." : "삭제"}
              </button>
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

      {/* 카드 그리드 */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground text-sm">아직 분석 결과가 없어요.</p>
          <Link href="/analyze/document" className="inline-block mt-3 text-sm text-accent hover:underline">
            첫 번째 문서를 분석해보세요 →
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginated.map((a) => (
              <AnalysisCard
                key={a.id}
                analysis={a}
                starred={starredIds.has(a.id)}
                onToggleStar={handleToggleStar}
                selectMode={selectMode}
                selected={selected.has(a.id)}
                onToggleSelect={toggleSelect}
                teamContext={teamContext ? { role: teamContext.role, addedIds: teamAddedIds } : undefined}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
