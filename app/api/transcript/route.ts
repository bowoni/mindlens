import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const videoId = request.nextUrl.searchParams.get("videoId");
  if (!videoId) {
    return NextResponse.json({ error: "videoId required" }, { status: 400 });
  }

  const apiKey = process.env.SUPADATA_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "SUPADATA_API_KEY not configured" }, { status: 500 });
  }

  const res = await fetch(
    `https://api.supadata.ai/v1/youtube/transcript?videoId=${encodeURIComponent(videoId)}&text=true`,
    { headers: { "x-api-key": apiKey } }
  );

  if (!res.ok) {
    return NextResponse.json({ error: "자막이 없는 영상입니다." }, { status: 422 });
  }

  const data = await res.json() as { content?: string };
  const transcript = data.content?.trim();
  if (!transcript) {
    return NextResponse.json({ error: "자막이 없는 영상입니다." }, { status: 422 });
  }

  return NextResponse.json({ transcript });
}
