import { YoutubeTranscript } from "youtube-transcript";

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

export async function fetchTranscript(videoId: string): Promise<string> {
  const items = await YoutubeTranscript.fetchTranscript(videoId);
  return items.map((item) => decodeHtmlEntities(item.text)).join(" ");
}

export async function searchVideos(keyword: string, maxResults = 5) {
  const apiKey = process.env.YOUTUBE_DATA_API_KEY!;
  const params = new URLSearchParams({
    part: "snippet",
    q: keyword,
    type: "video",
    maxResults: String(maxResults),
    key: apiKey,
  });

  const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
  if (!res.ok) throw new Error("YouTube 검색에 실패했습니다.");

  const data = await res.json();
  return (data.items ?? []).map((item: Record<string, unknown>) => {
    const snippet = item.snippet as Record<string, unknown>;
    const id = item.id as Record<string, unknown>;
    return {
      videoId: id.videoId as string,
      title: decodeHtmlEntities(snippet.title as string),
      channelTitle: decodeHtmlEntities(snippet.channelTitle as string),
      thumbnail: (snippet.thumbnails as Record<string, { url: string }>).medium?.url ?? "",
      publishedAt: snippet.publishedAt as string,
    };
  });
}
