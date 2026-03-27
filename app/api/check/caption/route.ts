export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const videoId = request.nextUrl.searchParams.get("videoId");
  if (!videoId) return NextResponse.json({ available: false, captionUrl: null });

  try {
    const res = await fetch("https://www.youtube.com/youtubei/v1/player", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "com.google.android.youtube/19.09.37 (Linux; U; Android 11) gzip",
        "X-Youtube-Client-Name": "3",
        "X-Youtube-Client-Version": "19.09.37",
      },
      body: JSON.stringify({
        videoId,
        context: {
          client: {
            clientName: "ANDROID",
            clientVersion: "19.09.37",
            androidSdkVersion: 30,
            hl: "en",
            gl: "US",
          },
        },
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ available: false, captionUrl: null, debug: `player API status: ${res.status}` });
    }

    const data = await res.json() as {
      captions?: {
        playerCaptionsTracklistRenderer?: {
          captionTracks?: { languageCode: string; baseUrl: string }[];
        };
      };
      playabilityStatus?: { status: string; reason?: string };
    };

    const playability = data?.playabilityStatus?.status;
    const tracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];

    if (tracks.length === 0) {
      return NextResponse.json({
        available: false,
        captionUrl: null,
        debug: `no tracks. playability: ${playability ?? "unknown"}`,
      });
    }

    const track =
      tracks.find((t) => t.languageCode === "ko") ||
      tracks.find((t) => t.languageCode === "en") ||
      tracks[0];

    return NextResponse.json({ available: true, captionUrl: `${track.baseUrl}&fmt=json3` });
  } catch (e) {
    return NextResponse.json({ available: false, captionUrl: null, debug: `exception: ${String(e)}` });
  }
}
