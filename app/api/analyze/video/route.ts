import { createClient } from "@/lib/supabase/server";
import { analyzeVideo, generateSuggestedQuestions } from "@/lib/gemini";
import { extractVideoId, fetchTranscript, decodeHtmlEntities } from "@/lib/youtube";
import { isUsageLimitExceeded } from "@/lib/usage";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  if (await isUsageLimitExceeded(supabase, user.id)) {
    return NextResponse.json(
      { error: `이번 달 무료 분석 횟수(${process.env.FREE_ANALYSIS_LIMIT ?? 5}회)를 모두 사용했습니다. Pro 플랜으로 업그레이드하세요.` },
      { status: 403 }
    );
  }

  const { url, transcript: providedTranscript } = await request.json();

  if (!url) {
    return NextResponse.json({ error: "URL이 없습니다." }, { status: 400 });
  }

  const videoId = extractVideoId(url);
  if (!videoId) {
    return NextResponse.json({ error: "유효한 YouTube URL이 아닙니다." }, { status: 400 });
  }

  let transcript: string;
  if (providedTranscript) {
    transcript = providedTranscript;
  } else {
    try {
      transcript = await fetchTranscript(videoId);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return NextResponse.json({ error: `자막 오류: ${msg}` }, { status: 422 });
    }
  }

  if (!transcript.trim()) {
    return NextResponse.json({ error: "자막 내용이 없습니다." }, { status: 422 });
  }

  let videoTitle = videoId;
  let videoPublishedAt: string | null = null;
  try {
    const apiKey = process.env.YOUTUBE_DATA_API_KEY!;
    const metaRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`
    );
    if (metaRes.ok) {
      const meta = await metaRes.json();
      const snippet = meta.items?.[0]?.snippet;
      if (snippet) {
        videoTitle = decodeHtmlEntities(snippet.title ?? videoId);
        videoPublishedAt = snippet.publishedAt ?? null;
      }
    }
  } catch { /* 실패 시 videoId로 대체 */ }

  let analysis;
  try {
    analysis = await analyzeVideo(transcript, videoTitle);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "AI 분석 중 오류가 발생했습니다.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  const suggestedQuestions = await generateSuggestedQuestions(analysis.title, analysis);

  const { data: analysisRow, error: analysisError } = await supabase
    .from("analyses")
    .insert({
      user_id: user.id,
      type: "video",
      title: analysis.title,
      content: { ...analysis, videoId, videoTitle, videoPublishedAt, url, suggestedQuestions },
      domain: "general",
    })
    .select()
    .single();

  if (analysisError) {
    return NextResponse.json({ error: "저장 실패" }, { status: 500 });
  }

  const month = new Date().toISOString().slice(0, 7);
  const { data: currentUsage } = await supabase
    .from("usage").select("count").eq("user_id", user.id).eq("month", month).maybeSingle();
  await supabase.from("usage").upsert(
    { user_id: user.id, month, count: (currentUsage?.count ?? 0) + 1 },
    { onConflict: "user_id,month" }
  );

  return NextResponse.json({ id: analysisRow.id, analysis });
}
