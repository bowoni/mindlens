import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

function getModel() {
  return genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL! });
}

export async function analyzeDocument(text: string, promptInstruction: string) {
  const maxChars = Number(process.env.GEMINI_MAX_TEXT_CHARS ?? 30000);

  const prompt = `
당신은 문서 분석 전문가입니다. ${promptInstruction}

아래 문서를 분석하고 반드시 다음 JSON 형식으로만 응답하세요. 다른 텍스트는 포함하지 마세요.

{
  "title": "문서 제목 또는 핵심 주제 (한 줄)",
  "summary": "핵심 내용 요약 (3~5문장)",
  "keywords": ["키워드1", "키워드2", "키워드3", "키워드4", "키워드5"],
  "sections": [
    { "heading": "섹션 제목", "content": "섹션 핵심 내용 요약" }
  ],
  "insights": ["주목할 인사이트1", "주목할 인사이트2", "주목할 인사이트3"]
}

--- 문서 내용 ---
${text.slice(0, maxChars)}
`;

  const result = await getModel().generateContent(prompt);
  const raw = result.response.text().trim();

  const json = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  return JSON.parse(json);
}

export async function generateSuggestedQuestions(title: string, content: unknown): Promise<string[]> {
  const prompt = `다음 분석 내용을 보고, 사용자가 궁금해할 만한 짧고 구체적인 질문 3개를 생성하세요.
반드시 JSON 배열 형태로만 응답하세요. 예: ["질문1", "질문2", "질문3"]
설명이나 다른 텍스트는 절대 포함하지 마세요.

분석 제목: ${title}
분석 내용: ${JSON.stringify(content).slice(0, 3000)}`;

  try {
    const result = await getModel().generateContent(prompt);
    const text = result.response.text().trim();
    const match = text.match(/\[[\s\S]*\]/);
    return match ? (JSON.parse(match[0]) as string[]).slice(0, 3) : [];
  } catch {
    return [];
  }
}

export async function analyzeVideo(transcript: string, title: string) {
  const maxChars = Number(process.env.GEMINI_MAX_TEXT_CHARS ?? 30000);

  const prompt = `
당신은 영상 콘텐츠 분석 전문가입니다.
아래는 YouTube 영상 "${title}"의 자막입니다. 분석하고 반드시 다음 JSON 형식으로만 응답하세요.

{
  "title": "영상 핵심 주제 (한 줄)",
  "summary": "전체 내용 요약 (3~5문장)",
  "keywords": ["키워드1", "키워드2", "키워드3", "키워드4", "키워드5"],
  "sections": [
    { "heading": "주요 섹션 제목", "content": "해당 섹션 핵심 내용" }
  ],
  "insights": ["주목할 인사이트1", "주목할 인사이트2", "주목할 인사이트3"]
}

--- 자막 내용 ---
${transcript.slice(0, maxChars)}
`;

  const result = await getModel().generateContent(prompt);
  const raw = result.response.text().trim();

  const json = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  return JSON.parse(json);
}
