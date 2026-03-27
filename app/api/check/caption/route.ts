import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const videoId = request.nextUrl.searchParams.get("videoId");
  if (!videoId) return NextResponse.json({ available: false });

  try {
    const apiKey = process.env.YOUTUBE_DATA_API_KEY!;
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoId}&key=${apiKey}`
    );
    if (!res.ok) return NextResponse.json({ available: false });

    const data = await res.json() as {
      items?: { contentDetails?: { caption?: string } }[];
    };

    const hasCaption = data.items?.[0]?.contentDetails?.caption === "true";
    return NextResponse.json({ available: hasCaption });
  } catch {
    return NextResponse.json({ available: false });
  }
}
