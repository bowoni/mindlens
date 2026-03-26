import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import AnalysisChat from "@/components/analysis-chat";
import ShareButton from "@/components/share-button";
import ExportButton from "@/components/export-button";

export default async function VideoResultPage({
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
    keywords: string[];
    sections: { heading: string; content: string }[];
    insights: string[];
    suggestedQuestions?: string[];
    videoId: string;
    videoTitle: string;
    videoPublishedAt?: string;
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
      {/* 영상 임베드 */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="aspect-video">
          <iframe
            src={`https://www.youtube.com/embed/${content.videoId}`}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>

      {/* 헤더 */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium px-2 py-0.5 rounded-full border border-amber-500/20 bg-amber-500/10 text-amber-500">
            영상
          </span>
          <span className="text-xs text-muted-foreground">
            분석: {new Date(data.created_at).toLocaleDateString("ko-KR")}
          </span>
          {content.videoPublishedAt && (
            <span className="text-xs text-muted-foreground">
              업로드: {new Date(content.videoPublishedAt).toLocaleDateString("ko-KR")}
            </span>
          )}
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
            <span key={kw} className="text-xs px-2.5 py-1 rounded-full bg-(--accent-subtle) text-accent font-medium">
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
              <div key={i} className="rounded-lg border border-border bg-card px-4 py-3 space-y-1">
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
                <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-(--accent-subtle) text-accent text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                {insight}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* AI 채팅 */}
      <AnalysisChat analysisId={data.id} suggestedQuestions={content.suggestedQuestions} />
    </div>
  );
}
