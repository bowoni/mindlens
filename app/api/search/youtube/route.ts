import { createClient } from "@/lib/supabase/server";
import { searchVideos } from "@/lib/youtube";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json({ error: "검색어가 없습니다." }, { status: 400 });
  }

  const maxResults = Number(request.nextUrl.searchParams.get("limit") ?? 5);

  try {
    const videos = await searchVideos(q, maxResults);
    return NextResponse.json({ videos });
  } catch {
    return NextResponse.json({ error: "YouTube 검색에 실패했습니다." }, { status: 502 });
  }
}
