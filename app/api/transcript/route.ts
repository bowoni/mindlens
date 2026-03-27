import { NextRequest, NextResponse } from "next/server";
import { getCaptionUrl, fetchTranscriptFromUrl } from "@/lib/youtube-transcript";

export async function GET(request: NextRequest) {
  const videoId = request.nextUrl.searchParams.get("videoId");
  if (!videoId) {
    return NextResponse.json({ error: "videoId required" }, { status: 400 });
  }

  // Step 1: Try to get caption URL via InnerTube (getInfo)
  let captionUrl: string;
  try {
    captionUrl = await getCaptionUrl(videoId);
  } catch (e) {
    return NextResponse.json(
      { error: `getCaptionUrl failed: ${e instanceof Error ? e.message : e}` },
      { status: 422 }
    );
  }

  // Step 2: Try to fetch transcript server-side from captionUrl
  try {
    const transcript = await fetchTranscriptFromUrl(captionUrl);
    return NextResponse.json({ source: "server", transcript });
  } catch {
    // Server-side fetch of timedtext is blocked — return captionUrl for client to fetch
    return NextResponse.json({ source: "fallback", captionUrl });
  }
}
