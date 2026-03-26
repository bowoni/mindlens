import { createServiceClient } from "@/lib/supabase/service";
import { notFound } from "next/navigation";
import Link from "next/link";
import { LensIcon } from "@/components/logo";

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = createServiceClient();

  const { data } = await supabase
    .from("analyses")
    .select("*")
    .eq("share_token", token)
    .single();

  if (!data) notFound();

  const content = data.content as Record<string, unknown>;

  return (
    <div className="min-h-screen bg-background">
      {/* 상단 헤더 */}
      <header className="sticky top-0 z-10 flex items-center justify-between px-6 h-14 bg-background/80 backdrop-blur border-b border-border">
        <Link href="/" className="flex items-center gap-2">
          <LensIcon size={20} className="text-accent" />
          <span className="font-semibold text-sm tracking-tight">MindLens</span>
        </Link>
        <Link
          href="/login"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          로그인
        </Link>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
        {/* 공유 배너 */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
            <polyline points="16 6 12 2 8 6"/>
            <line x1="12" y1="2" x2="12" y2="15"/>
          </svg>
          MindLens로 공유된 분석입니다.{" "}
          <Link href="/signup" className="text-accent hover:underline">
            무료로 시작하기 →
          </Link>
        </div>

        {data.type === "video" && <VideoContent data={data} content={content} />}
        {data.type === "document" && <DocumentContent data={data} content={content} />}
        {data.type === "comparison" && <CompareContent data={data} content={content} />}
      </div>
    </div>
  );
}

function VideoContent({ data, content }: { data: Record<string, unknown>; content: Record<string, unknown> }) {
  const c = content as {
    title: string; summary: string; keywords: string[];
    sections: { heading: string; content: string }[];
    insights: string[]; videoId: string; videoPublishedAt?: string;
  };
  return (
    <>
      {c.videoId && (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="aspect-video">
            <iframe
              src={`https://www.youtube.com/embed/${c.videoId}`}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
      <AnalysisHeader data={data} type="영상" typeColor="border-amber-500/20 bg-amber-500/10 text-amber-500" title={c.title} />
      <Summary text={c.summary} />
      <Keywords keywords={c.keywords} />
      <Sections sections={c.sections} />
      <Insights insights={c.insights} />
    </>
  );
}

function DocumentContent({ data, content }: { data: Record<string, unknown>; content: Record<string, unknown> }) {
  const c = content as {
    title: string; summary: string; keywords: string[];
    sections: { heading: string; content: string }[];
    insights: string[];
  };
  return (
    <>
      <AnalysisHeader data={data} type="문서" typeColor="border-border text-muted-foreground" title={c.title} />
      <Summary text={c.summary} />
      <Keywords keywords={c.keywords} />
      <Sections sections={c.sections} />
      <Insights insights={c.insights} />
    </>
  );
}

function CompareContent({ data, content }: { data: Record<string, unknown>; content: Record<string, unknown> }) {
  const c = content as {
    title: string; summary: string;
    commonalities: string[];
    differences: { aspect: string; details: string }[];
    insights: string[]; recommendation: string;
  };
  return (
    <>
      <AnalysisHeader data={data} type="비교 분석" typeColor="border-border text-muted-foreground" title={c.title} />
      <Summary text={c.summary} />
      {c.commonalities?.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">공통점</h2>
          <ul className="space-y-2">
            {c.commonalities.map((item, i) => (
              <li key={i} className="flex gap-3 text-sm text-muted-foreground leading-relaxed">
                <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-(--accent-subtle) text-accent text-xs font-bold flex items-center justify-center">{i + 1}</span>
                {item}
              </li>
            ))}
          </ul>
        </section>
      )}
      {c.differences?.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">차이점</h2>
          <div className="space-y-3">
            {c.differences.map((diff, i) => (
              <div key={i} className="rounded-lg border border-border bg-card px-4 py-3 space-y-1">
                <p className="text-sm font-medium text-foreground">{diff.aspect}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{diff.details}</p>
              </div>
            ))}
          </div>
        </section>
      )}
      <Insights insights={c.insights} label="종합 인사이트" />
      {c.recommendation && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">추천</h2>
          <div className="rounded-lg border border-accent/30 bg-(--accent-subtle) px-4 py-3">
            <p className="text-sm text-foreground leading-relaxed">{c.recommendation}</p>
          </div>
        </section>
      )}
    </>
  );
}

function AnalysisHeader({ data, type, typeColor, title }: {
  data: Record<string, unknown>; type: string; typeColor: string; title: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${typeColor}`}>{type}</span>
        <span className="text-xs text-muted-foreground">
          {new Date(data.created_at as string).toLocaleDateString("ko-KR")}
        </span>
      </div>
      <h1 className="text-2xl font-semibold text-foreground tracking-tight leading-snug">{title}</h1>
    </div>
  );
}

function Summary({ text }: { text: string }) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">요약</h2>
      <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
    </section>
  );
}

function Keywords({ keywords }: { keywords: string[] }) {
  if (!keywords?.length) return null;
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">키워드</h2>
      <div className="flex flex-wrap gap-2">
        {keywords.map((kw) => (
          <span key={kw} className="text-xs px-2.5 py-1 rounded-full bg-(--accent-subtle) text-accent font-medium">{kw}</span>
        ))}
      </div>
    </section>
  );
}

function Sections({ sections }: { sections: { heading: string; content: string }[] }) {
  if (!sections?.length) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">섹션별 분석</h2>
      <div className="space-y-3">
        {sections.map((sec, i) => (
          <div key={i} className="rounded-lg border border-border bg-card px-4 py-3 space-y-1">
            <p className="text-sm font-medium text-foreground">{sec.heading}</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{sec.content}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Insights({ insights, label = "주목할 인사이트" }: { insights: string[]; label?: string }) {
  if (!insights?.length) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">{label}</h2>
      <ul className="space-y-2">
        {insights.map((insight, i) => (
          <li key={i} className="flex gap-3 text-sm text-muted-foreground leading-relaxed">
            <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-(--accent-subtle) text-accent text-xs font-bold flex items-center justify-center">{i + 1}</span>
            {insight}
          </li>
        ))}
      </ul>
    </section>
  );
}
