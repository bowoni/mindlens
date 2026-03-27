import { createClient } from "@/lib/supabase/server";
import { fetchTranscript } from "@/lib/youtube";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const videoId = request.nextUrl.searchParams.get("videoId");
  if (!videoId) return NextResponse.json({ error: "videoId가 없습니다." }, { status: 400 });

  try {
    await fetchTranscript(videoId);
    return NextResponse.json({ available: true });
  } catch {
    return NextResponse.json({ available: false });
  }
}
