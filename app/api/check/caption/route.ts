export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const videoId = request.nextUrl.searchParams.get("videoId");
  if (!videoId) return NextResponse.json({ available: false, captionUrl: null });

  try {
    const res = await fetch("https://www.youtube.com/youtubei/v1/player?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "com.google.ios.youtube/19.09.3 (iPhone14,3; U; CPU iOS 16_1 like Mac OS X)",
        "X-Youtube-Client-Name": "5",
        "X-Youtube-Client-Version": "19.09.3",
      },
      body: JSON.stringify({
        videoId,
        context: {
          client: {
            clientName: "IOS",
            clientVersion: "19.09.3",
            deviceModel: "iPhone14,3",
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
