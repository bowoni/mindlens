"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Video = {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
};

export default function RelatedVideos({ keywords }: { keywords: string[] }) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!keywords?.length) { setLoading(false); return; }
    const q = keywords.slice(0, 3).join(" ");
    fetch(`/api/search/youtube?q=${encodeURIComponent(q)}&limit=3`)
      .then((r) => r.json())
      .then((data) => setVideos(data.videos ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [keywords]);

  if (loading) {
    return (
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">관련 YouTube 영상</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-lg border border-border bg-card overflow-hidden animate-pulse">
              <div className="aspect-video bg-muted" />
              <div className="p-2.5 space-y-1.5">
                <div className="h-3 bg-muted rounded w-full" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!videos.length) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">관련 YouTube 영상</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {videos.map((v) => (
          <Link
            key={v.videoId}
            href={`https://www.youtube.com/watch?v=${v.videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-lg border border-border bg-card overflow-hidden hover:border-accent/50 transition-colors"
          >
            <div className="aspect-video overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={v.thumbnail}
                alt={v.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
            </div>
            <div className="p-2.5 space-y-0.5">
              <p className="text-xs font-medium text-foreground line-clamp-2 leading-snug">{v.title}</p>
              <p className="text-xs text-muted-foreground truncate">{v.channelTitle}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
