import { createClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: "로그인이 필요합니다." }), { status: 401 });
  }

  const { analysisId, messages } = await request.json();

  if (!analysisId || !messages?.length) {
    return new Response(JSON.stringify({ error: "잘못된 요청입니다." }), { status: 400 });
  }

  const { data: analysis } = await supabase
    .from("analyses")
    .select("type, title, content")
    .eq("id", analysisId)
    .eq("user_id", user.id)
    .single();

  if (!analysis) {
    return new Response(JSON.stringify({ error: "분석을 찾을 수 없습니다." }), { status: 404 });
  }

  const typeLabel = analysis.type === "video" ? "YouTube 영상" : "문서";
  const systemInstruction = `당신은 ${typeLabel} 분석 내용을 바탕으로 질문에 답하는 AI 어시스턴트입니다. 반드시 한국어로만 답변하세요.

분석 제목: ${analysis.title}
분석 내용:
${JSON.stringify(analysis.content, null, 2)}`;

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL!,
    systemInstruction,
  });

  const history = messages.slice(0, -1).map((m: { role: string; content: string }) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const lastMessage = messages[messages.length - 1].content as string;

  const chat = model.startChat({ history });
  const result = await chat.sendMessageStream(lastMessage);

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) controller.enqueue(encoder.encode(text));
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
