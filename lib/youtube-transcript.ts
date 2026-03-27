import { Innertube } from "youtubei.js";
import { decodeHtmlEntities } from "./youtube";

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
  if (!res.ok) throw new Error(`timedtext fetch failed: ${res.status}`);
  const data = await res.json() as { events?: { segs?: { utf8?: string }[] }[] };
  const text = (data.events ?? [])
    .flatMap((e) => e.segs ?? [])
    .map((s) => decodeHtmlEntities(s.utf8 ?? "").replace(/\n/g, " "))
    .join(" ")
    .trim();
  if (!text) throw new Error("transcript empty");
  return text;
}
