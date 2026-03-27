import { Innertube } from "youtubei.js";

export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)));
}

export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

type CaptionTrack = { language_code: string; base_url: string };

export async function getCaptionUrl(videoId: string): Promise<string> {
  const yt = await Innertube.create();
  const info = await yt.getInfo(videoId);

  const tracks = (info.captions?.caption_tracks ?? []) as CaptionTrack[];
  if (tracks.length === 0) throw new Error("No captions available");

  const track =
    tracks.find((t) => t.language_code === "ko") ||
    tracks.find((t) => t.language_code === "en") ||
    tracks[0];

  return `${track.base_url}&fmt=json3`;
}

export async function fetchTranscriptFromUrl(captionUrl: string): Promise<string> {
  const res = await fetch(captionUrl);
  if (!res.ok) throw new Error(`Caption fetch failed: ${res.status}`);

  const data = await res.json() as {
    events?: { segs?: { utf8?: string }[] }[];
  };

  const text = (data.events ?? [])
    .flatMap((e) => e.segs ?? [])
    .map((s) => decodeHtmlEntities(s.utf8 ?? ""))
    .join(" ")
    .replace(/\n/g, " ")
    .trim();

  if (!text) throw new Error("transcript empty");
  return text;
}

// 로컬 개발용 (서버에서 직접 fetch 가능한 환경)
export async function fetchTranscript(videoId: string): Promise<string> {
  const captionUrl = await getCaptionUrl(videoId);
  return fetchTranscriptFromUrl(captionUrl);
}

async function fetchByOrder(keyword: string, order: string, maxResults: number) {
  const apiKey = process.env.YOUTUBE_DATA_API_KEY!;
  const params = new URLSearchParams({
    part: "snippet",
    q: keyword,
    type: "video",
    order,
    maxResults: String(maxResults),
    videoCaption: "closedCaption",
    key: apiKey,
  });

  const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
  if (!res.ok) return [];

  const data = await res.json();
  return (data.items ?? [])
    .map((item: Record<string, unknown>) => {
      const snippet = item.snippet as Record<string, unknown>;
      const id = item.id as Record<string, unknown>;
      return {
        videoId: id.videoId as string | undefined,
        title: decodeHtmlEntities(snippet.title as string),
        channelTitle: decodeHtmlEntities(snippet.channelTitle as string),
        thumbnail: (snippet.thumbnails as Record<string, { url: string }>).medium?.url ?? "",
        publishedAt: snippet.publishedAt as string,
      };
    })
    .filter((v: { videoId: string | undefined; title: string; channelTitle: string; thumbnail: string; publishedAt: string }): v is { videoId: string; title: string; channelTitle: string; thumbnail: string; publishedAt: string } => !!v.videoId);
}

export async function searchVideos(keyword: string, maxResults = 5) {
  const [byRelevance, byViewCount] = await Promise.all([
    fetchByOrder(keyword, "relevance", maxResults),
    fetchByOrder(keyword, "viewCount", maxResults),
  ]);

  const seen = new Set<string>();
  const results = [];
  for (const video of [...byRelevance, ...byViewCount]) {
    if (!seen.has(video.videoId)) {
      seen.add(video.videoId);
      results.push(video);
    }
  }
  return results;
}
