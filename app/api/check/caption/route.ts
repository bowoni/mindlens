export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const videoId = request.nextUrl.searchParams.get("videoId");
  if (!videoId) return NextResponse.json({ available: false, captionUrl: null });

  try {
    const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    const html = await pageRes.text();
    const match = html.match(/ytInitialPlayerResponse\s*=\s*(\{[\s\S]+?\})\s*;/);
    if (!match) return NextResponse.json({ available: false, captionUrl: null });

    const playerResponse = JSON.parse(match[1]) as {
      captions?: {
        playerCaptionsTracklistRenderer?: {
          captionTracks?: { languageCode: string; baseUrl: string }[];
        };
      };
    };

    const tracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
    if (tracks.length === 0) return NextResponse.json({ available: false, captionUrl: null });

    const track =
      tracks.find((t) => t.languageCode === "ko") ||
      tracks.find((t) => t.languageCode === "en") ||
      tracks[0];

    return NextResponse.json({ available: true, captionUrl: `${track.baseUrl}&fmt=json3` });
  } catch {
    return NextResponse.json({ available: false, captionUrl: null });
  }
}
