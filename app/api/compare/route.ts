import { createClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { generateSuggestedQuestions } from "@/lib/gemini";
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

  const { ids } = await request.json();

  if (!Array.isArray(ids) || ids.length < 2 || ids.length > 3) {
    return NextResponse.json({ error: "2~3개의 분석을 선택해주세요." }, { status: 400 });
  }

  const { data: analyses } = await supabase
    .from("analyses")
    .select("id, type, title, content")
    .in("id", ids)
    .eq("user_id", user.id);

  if (!analyses || analyses.length < 2) {
    return NextResponse.json({ error: "분석을 찾을 수 없습니다." }, { status: 404 });
  }

  // ids 순서대로 정렬 (DB 반환 순서 보장 안 됨)
  const sortedAnalyses = ids
    .map((id: string) => analyses.find((a) => a.id === id))
    .filter((a): a is NonNullable<typeof a> => a != null);

  const maxChars = Number(process.env.GEMINI_MAX_TEXT_CHARS ?? 30000);

  const analysisBlocks = sortedAnalyses
    .map((a, i) => {
      const typeLabel = a.type === "video" ? "영상" : "문서";
      return `[${i + 1}] ${typeLabel}: ${a.title}\n${JSON.stringify(a.content).slice(0, Math.floor(maxChars / analyses.length))}`;
    })
    .join("\n\n---\n\n");

  const prompt = `당신은 콘텐츠 비교 분석 전문가입니다.
아래 ${analyses.length}개의 분석 결과를 비교하고 반드시 다음 JSON 형식으로만 응답하세요.

중요: recommendation 필드에서 각 콘텐츠를 언급할 때는 반드시 [1], [2], [3] 형식으로만 표기하세요. 제목을 직접 쓰지 마세요.

{
  "title": "비교 분석 제목 (한 줄)",
  "summary": "전체 비교 요약 (3~5문장)",
  "commonalities": ["공통점1", "공통점2", "공통점3"],
  "differences": [
    { "aspect": "비교 관점", "details": "각 콘텐츠의 차이점 설명" }
  ],
  "insights": ["종합 인사이트1", "종합 인사이트2", "종합 인사이트3"],
  "recommendation": "[1]은 ~한 사람에게 적합하고, [2]는 ~한 사람에게 적합하다."
}

--- 분석 대상 ---
${analysisBlocks}`;

  let result;
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL! });
    const response = await model.generateContent(prompt);
    const raw = response.response.text().trim();
    const json = raw
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();
    result = JSON.parse(json);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "AI 분석 중 오류가 발생했습니다.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  const suggestedQuestions = await generateSuggestedQuestions(result.title, result);

  const { data: saved, error: saveError } = await supabase
    .from("analyses")
    .insert({
      user_id: user.id,
      type: "comparison",
      title: result.title,
      content: { ...result, sourceIds: ids, suggestedQuestions },
      domain: "general",
    })
    .select()
    .single();

  if (saveError) {
    return NextResponse.json({ error: `저장 실패: ${saveError.message}` }, { status: 500 });
  }

  const month = new Date().toISOString().slice(0, 7);
  const { data: currentUsage } = await supabase
    .from("usage").select("count").eq("user_id", user.id).eq("month", month).maybeSingle();
  await supabase.from("usage").upsert(
    { user_id: user.id, month, count: (currentUsage?.count ?? 0) + 1 },
    { onConflict: "user_id,month" }
  );

  return NextResponse.json({ id: saved.id, result });
}
