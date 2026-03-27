"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import RecentAnalysesSidebar from "@/components/recent-analyses-sidebar";

async function fetchTranscriptClient(videoId: string): Promise<string> {
  const res = await fetch(`/api/transcript?videoId=${encodeURIComponent(videoId)}`);
  const data = await res.json() as { transcript?: string; error?: string };
  if (!res.ok || !data.transcript) throw new Error(data.error ?? "자막이 없는 영상입니다.");
  return data.transcript;
}

type Video = {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  publishedAt: string;
};

export default function VideoAnalyzePage() {
  const [tab, setTab] = useState<"url" | "search">("url");
  const router = useRouter();

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">영상 분석</h1>
        <p className="text-sm text-muted-foreground mt-1">
          YouTube 영상을 분석하거나 키워드로 검색해보세요.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-10">
        <div className="min-w-0">
          {/* 탭 */}
          <div className="flex gap-1 mb-8 border-b border-border">
            <button
              onClick={() => setTab("url")}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                tab === "url"
                  ? "border-accent text-accent"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              URL 입력
            </button>
            <button
              onClick={() => setTab("search")}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                tab === "search"
                  ? "border-accent text-accent"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              키워드 검색
            </button>
          </div>

          {tab === "url" ? (
            <UrlTab router={router} />
          ) : (
            <SearchTab router={router} />
          )}
        </div>
        <RecentAnalysesSidebar type="video" title="최근 영상 분석" />
      </div>
    </div>
  );
}

function UrlTab({ router }: { router: ReturnType<typeof useRouter> }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captionStatus, setCaptionStatus] = useState<"idle" | "checking" | "available" | "unavailable">("idle");
  const captionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const videoId = extractVideoId(url);
    if (!videoId) { setCaptionStatus("idle"); return; }

    setCaptionStatus("checking");
    if (captionTimerRef.current) clearTimeout(captionTimerRef.current);

    captionTimerRef.current = setTimeout(async () => {
      try {
        const transcript = await fetchTranscriptClient(videoId);
        setCaptionStatus(transcript ? "available" : "unavailable");
      } catch {
        setCaptionStatus("unavailable");
      }
    }, 600);

    return () => { if (captionTimerRef.current) clearTimeout(captionTimerRef.current); };
  }, [url]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    let transcript: string;
    try {
      transcript = await fetchTranscriptClient(extractVideoId(url) ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "자막을 가져올 수 없습니다.");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/analyze/video", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, transcript }),
    });

    let data: { id?: string; error?: string } = {};
    try { data = await res.json(); } catch {
      setError("서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
      setLoading(false);
      return;
    }

    if (!res.ok) {
      setError(data.error ?? "분석 중 오류가 발생했습니다.");
      setLoading(false);
      return;
    }

    router.push(`/analyze/video/${data.id}`);
  }

  const videoId = extractVideoId(url);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">YouTube URL</label>
        <div className="flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            placeholder="https://www.youtube.com/watch?v=..."
            className="flex-1 h-10 px-3 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-shadow"
          />
          <button
            type="button"
            onClick={async () => setUrl(await navigator.clipboard.readText())}
            className="h-10 px-3 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted text-sm transition-colors"
          >
            붙여넣기
          </button>
        </div>

        {/* 자막 상태 */}
        {captionStatus === "checking" && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            자막 확인 중...
          </p>
        )}
        {captionStatus === "available" && (
          <p className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
            자막이 확인되었습니다
          </p>
        )}
        {captionStatus === "unavailable" && (
          <p className="flex items-center gap-1.5 text-xs text-red-500">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
            자막이 없는 영상입니다
          </p>
        )}
        {captionStatus === "idle" && (
          <p className="text-xs text-muted-foreground">
            자막이 있는 영상만 분석 가능합니다. (youtube.com, youtu.be, Shorts 지원)
          </p>
        )}
      </div>

      {videoId && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="aspect-video w-full">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg px-3 py-2.5">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!url || loading || captionStatus !== "available"}
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
  );
}

function SearchTab({ router }: { router: ReturnType<typeof useRouter> }) {
  const [keyword, setKeyword] = useState("");
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = keyword.trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/search/youtube?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "검색에 실패했습니다."); setVideos([]); }
    else setVideos(data.videos ?? []);
    setLoading(false);
  }

  async function handleAnalyze(video: Video) {
    setAnalyzingId(video.videoId);
    let transcript: string;
    try {
      transcript = await fetchTranscriptClient(video.videoId);
    } catch (err) {
      alert(err instanceof Error ? err.message : "자막을 가져올 수 없습니다.");
      setAnalyzingId(null);
      return;
    }

    const res = await fetch("/api/analyze/video", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: `https://www.youtube.com/watch?v=${video.videoId}`, transcript }),
    });
    const data = await res.json();
    if (!res.ok) { alert(data.error ?? "분석 중 오류가 발생했습니다."); setAnalyzingId(null); return; }
    router.push(`/analyze/video/${data.id}`);
  }

  return (
    <div>
      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="검색어를 입력하세요..."
          className="flex-1 h-10 px-3 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-shadow"
        />
        <button
          type="submit"
          disabled={!keyword.trim() || loading}
          className="h-10 px-4 rounded-lg bg-accent hover:bg-(--accent-hover) disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors flex items-center gap-1.5"
        >
          {loading ? (
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
          ) : "검색"}
        </button>
      </form>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg px-3 py-2.5 mb-4">
          {error}
        </p>
      )}

      {videos.length > 0 && (
        <div className="space-y-3">
          {videos.map((video) => (
            <div key={video.videoId} className="flex gap-4 rounded-xl border border-border bg-card p-4 items-start">
              <div className="shrink-0 w-32 aspect-video rounded-lg overflow-hidden bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <p className="text-sm font-medium text-foreground leading-snug line-clamp-2">{video.title}</p>
                <p className="text-xs text-muted-foreground">{video.channelTitle}</p>
                <p className="text-xs text-muted-foreground">{new Date(video.publishedAt).toLocaleDateString("ko-KR")}</p>
              </div>
              <button
                onClick={() => handleAnalyze(video)}
                disabled={analyzingId !== null}
                className="shrink-0 h-8 px-3 rounded-lg border border-accent text-accent hover:bg-(--accent-subtle) disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium transition-colors"
              >
                {analyzingId === video.videoId ? "분석 중..." : "분석"}
              </button>
            </div>
          ))}
        </div>
      )}

      {!loading && videos.length === 0 && keyword.trim() && !error && (
        <p className="text-sm text-muted-foreground text-center py-12">검색 결과가 없습니다.</p>
      )}
    </div>
  );
}

function extractVideoId(url: string): string {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&\n?#]+)/);
  return match?.[1] ?? "";
}
