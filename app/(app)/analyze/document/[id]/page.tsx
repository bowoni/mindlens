import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import AnalysisChat from "@/components/analysis-chat";
import ShareButton from "@/components/share-button";
import ExportButton from "@/components/export-button";
import RelatedVideos from "@/components/related-videos";

export default async function DocumentResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("analyses")
    .select("*, documents(*)")
    .eq("id", id)
    .single();

  if (!data) notFound();

  const content = data.content as {
    title: string;
    summary: string;
    keywords: string[];
    sections: { heading: string; content: string }[];
    insights: string[];
    suggestedQuestions?: string[];
  };

  // domain label은 domain_configs 테이블에서 가져옴
  const { data: domainRows } = await supabase
    .from("domain_configs")
    .select("key, label");
  const DOMAIN_LABEL: Record<string, string> = Object.fromEntries(
    (domainRows ?? []).map((d) => [d.key, d.label])
  );

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
      {/* 헤더 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium px-2 py-0.5 rounded-full border border-border text-muted-foreground">
            {DOMAIN_LABEL[data.domain] ?? data.domain}
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

      {/* 요약 */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">요약</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">{content.summary}</p>
      </section>

      {/* 키워드 */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">키워드</h2>
        <div className="flex flex-wrap gap-2">
          {content.keywords.map((kw) => (
            <span
              key={kw}
              className="text-xs px-2.5 py-1 rounded-full bg-(--accent-subtle) text-[var(--accent)] font-medium"
            >
              {kw}
            </span>
          ))}
        </div>
      </section>

      {/* 섹션별 분석 */}
      {content.sections?.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">섹션별 분석</h2>
          <div className="space-y-3">
            {content.sections.map((sec, i) => (
              <div
                key={i}
                className="rounded-lg border border-border bg-card px-4 py-3 space-y-1"
              >
                <p className="text-sm font-medium text-foreground">{sec.heading}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{sec.content}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 인사이트 */}
      {content.insights?.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">주목할 인사이트</h2>
          <ul className="space-y-2">
            {content.insights.map((insight, i) => (
              <li key={i} className="flex gap-3 text-sm text-muted-foreground leading-relaxed">
                <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-(--accent-subtle) text-[var(--accent)] text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                {insight}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 관련 YouTube 영상 */}
      <RelatedVideos keywords={content.keywords} />

      {/* AI 채팅 */}
      <AnalysisChat analysisId={data.id} suggestedQuestions={content.suggestedQuestions} />
    </div>
  );
}
