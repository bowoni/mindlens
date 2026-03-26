import { createClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const { analysisId } = await request.json();

  const { data: analysis } = await supabase
    .from("analyses")
    .select("type, title, content")
    .eq("id", analysisId)
    .eq("user_id", user.id)
    .single();

  if (!analysis) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL! });

  const prompt = `다음 분석 내용을 보고, 사용자가 궁금해할 만한 짧고 구체적인 질문 3개를 생성하세요.
반드시 JSON 배열 형태로만 응답하세요. 예: ["질문1", "질문2", "질문3"]
설명이나 다른 텍스트는 절대 포함하지 마세요.

분석 제목: ${analysis.title}
분석 내용: ${JSON.stringify(analysis.content)}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  try {
    const match = text.match(/\[[\s\S]*\]/);
    const questions: string[] = match ? JSON.parse(match[0]) : [];
    return Response.json({ questions: questions.slice(0, 3) });
  } catch {
    return Response.json({ questions: [] });
  }
}
