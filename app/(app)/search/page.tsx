"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type Video = {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  publishedAt: string;
};

export default function SearchPage() {
  const [keyword, setKeyword] = useState("");
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const q = keyword.trim();
    if (!q) {
      setVideos([]);
      setError(null);
      return;
    }

    setLoading(true);
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      setError(null);
      const res = await fetch(`/api/search/youtube?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "검색에 실패했습니다.");
        setVideos([]);
      } else {
        setVideos(data.videos ?? []);
      }
      setLoading(false);
    }, 500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [keyword]);

  async function handleAnalyze(video: Video) {
    setAnalyzingId(video.videoId);

    const res = await fetch("/api/analyze/video", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: `https://www.youtube.com/watch?v=${video.videoId}` }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error ?? "분석 중 오류가 발생했습니다.");
      setAnalyzingId(null);
      return;
    }

    router.push(`/analyze/video/${data.id}`);
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">키워드 검색</h1>
        <p className="text-sm text-muted-foreground mt-1">
          키워드로 YouTube 영상을 검색하고 바로 AI 분석을 시작하세요.
        </p>
      </div>

      <div className="relative mb-8">
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="검색어를 입력하세요..."
          className="w-full h-10 px-3 pr-9 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-shadow"
        />
        {loading && (
          <svg className="absolute right-3 top-3 w-4 h-4 animate-spin text-muted-foreground" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg px-3 py-2.5 mb-6">
          {error}
        </p>
      )}

      {videos.length > 0 && (
        <div className="space-y-3">
          {videos.map((video) => (
            <div
              key={video.videoId}
              className="flex gap-4 rounded-xl border border-border bg-card p-4 items-start"
            >
              {/* 썸네일 */}
              <div className="shrink-0 w-32 aspect-video rounded-lg overflow-hidden bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* 정보 */}
              <div className="flex-1 min-w-0 space-y-1">
                <p className="text-sm font-medium text-foreground leading-snug line-clamp-2">
                  {video.title}
                </p>
                <p className="text-xs text-muted-foreground">{video.channelTitle}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(video.publishedAt).toLocaleDateString("ko-KR")}
                </p>
              </div>

              {/* 분석 버튼 */}
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
        <p className="text-sm text-muted-foreground text-center py-12">
          검색 결과가 없습니다.
        </p>
      )}
    </div>
  );
}
