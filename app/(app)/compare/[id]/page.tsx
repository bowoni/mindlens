import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import AnalysisChat from "@/components/analysis-chat";
import ShareButton from "@/components/share-button";
import ExportButton from "@/components/export-button";

export default async function CompareResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("analyses")
    .select("*")
    .eq("id", id)
    .single();

  if (!data) notFound();

  const content = data.content as {
    title: string;
    summary: string;
    commonalities: string[];
    differences: { aspect: string; details: string }[];
    insights: string[];
    recommendation: string;
    sourceIds?: string[];
  };

  // 원본 분석 목록 조회
  const { data: sources } = content.sourceIds?.length
    ? await supabase
        .from("analyses")
        .select("id, type, title, content")
        .in("id", content.sourceIds)
    : { data: [] };

  // sourceIds 순서대로 정렬
  const sortedSources = content.sourceIds
    ? (content.sourceIds
        .map((sid) => sources?.find((s) => s.id === sid))
        .filter(Boolean) as { id: string; type: string; title: string; content: Record<string, string> }[])
    : ((sources ?? []) as { id: string; type: string; title: string; content: Record<string, string> }[]);

  // 인덱스 → YouTube URL 맵 (영상 타입만)
  const videoUrlMap: Record<number, string> = {};
  sortedSources.forEach((src, i) => {
    if (src.type === "video" && src.content?.videoId) {
      videoUrlMap[i + 1] = `https://www.youtube.com/watch?v=${src.content.videoId}`;
    }
  });

  // 추천 텍스트에서 "영상 [N]" → 링크 파싱
  function parseRecommendation(text: string) {
    const parts = text.split(/(영상\s*\[\d+\]|\[\d+\])/g);
    return parts.map((part, i) => {
      const match = part.match(/\[(\d+)\]/);
      if (!match) return part;
      const idx = Number(match[1]);
      const url = videoUrlMap[idx];
      if (!url) return part;
      return (
        <a
          key={i}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent underline underline-offset-2 hover:opacity-80 transition-opacity"
        >
          {part}
        </a>
      );
    });
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
      {/* 헤더 */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium px-2 py-0.5 rounded-full border border-border text-muted-foreground">
            비교 분석
          </span>
          <span className="text-xs text-muted-foreground">
            {new Date(data.created_at).toLocaleDateString("ko-KR")}
          </span>
        </div>
        <h1 className="text-2xl font-semibold text-foreground tracking-tight leading-snug">
          {content.title}
        </h1>
        <div className="flex items-center gap-4">
          <ShareButton analysisId={data.id} shareToken={data.share_token ?? null} />
          <ExportButton analysisType={data.type} content={content} />
        </div>
      </div>

      {/* 비교 대상 목록 */}
      {sortedSources.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">비교 대상</h2>
          <div className="space-y-1.5">
            {sortedSources.map((src, i) => (
              <Link
                key={src.id}
                href={`/analyze/${src.type}/${src.id}`}
                className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 hover:border-accent/50 transition-colors"
              >
                <span className="shrink-0 w-5 h-5 rounded-full bg-(--accent-subtle) text-accent text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border shrink-0 ${
                  src.type === "video"
                    ? "border-amber-500/20 bg-amber-500/10 text-amber-500"
                    : "border-border text-muted-foreground"
                }`}>
                  {src.type === "video" ? "영상" : "문서"}
                </span>
                <span className="text-sm text-foreground truncate">{src.title}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 요약 */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">요약</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">{content.summary}</p>
      </section>

      {/* 공통점 */}
      {content.commonalities?.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">공통점</h2>
          <ul className="space-y-2">
            {content.commonalities.map((item, i) => (
              <li key={i} className="flex gap-3 text-sm text-muted-foreground leading-relaxed">
                <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-(--accent-subtle) text-accent text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                {item}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 차이점 */}
      {content.differences?.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">차이점</h2>
          <div className="space-y-3">
            {content.differences.map((diff, i) => (
              <div key={i} className="rounded-lg border border-border bg-card px-4 py-3 space-y-1">
                <p className="text-sm font-medium text-foreground">{diff.aspect}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{diff.details}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 인사이트 */}
      {content.insights?.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">종합 인사이트</h2>
          <ul className="space-y-2">
            {content.insights.map((insight, i) => (
              <li key={i} className="flex gap-3 text-sm text-muted-foreground leading-relaxed">
                <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-(--accent-subtle) text-accent text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                {insight}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 추천 */}
      {content.recommendation && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">추천</h2>
          <div className="rounded-lg border border-accent/30 bg-(--accent-subtle) px-4 py-3">
            <p className="text-sm text-foreground leading-relaxed">
              {parseRecommendation(content.recommendation)}
            </p>
          </div>
        </section>
      )}

      <AnalysisChat analysisId={data.id} suggestedQuestions={(content as Record<string, unknown>).suggestedQuestions as string[] | undefined} />
    </div>
  );
}
