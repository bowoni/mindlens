import { createClient } from "@/lib/supabase/server";
import { analyzeDocument, generateSuggestedQuestions } from "@/lib/gemini";
import { isUsageLimitExceeded } from "@/lib/usage";
import { NextRequest, NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

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

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const domainKey = formData.get("domain") as string ?? "general";

  if (!file) {
    return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
  }

  const { data: domainConfig } = await supabase
    .from("domain_configs")
    .select("prompt_instruction")
    .eq("key", domainKey)
    .single();

  if (!domainConfig) {
    return NextResponse.json({ error: "유효하지 않은 분석 모드입니다." }, { status: 400 });
  }

  const maxFileSizeMB = Number(process.env.NEXT_PUBLIC_MAX_FILE_SIZE_MB ?? 20);
  if (file.size > maxFileSizeMB * 1024 * 1024) {
    return NextResponse.json(
      { error: `파일 크기는 ${maxFileSizeMB}MB 이하여야 합니다.` },
      { status: 400 }
    );
  }

  const fileType = file.name.endsWith(".pdf") ? "pdf" : "docx";
  const buffer = Buffer.from(await file.arrayBuffer());

  let text = "";
  let pageCount: number | undefined;

  if (fileType === "pdf") {
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    const parsed = await parser.getText();
    text = parsed.text;
    pageCount = parsed.total;
    await parser.destroy();
  } else {
    const result = await mammoth.extractRawText({ buffer });
    text = result.value;
  }

  if (!text.trim()) {
    return NextResponse.json(
      { error: "문서에서 텍스트를 추출할 수 없습니다. 스캔된 이미지 PDF는 지원하지 않습니다." },
      { status: 422 }
    );
  }

  let analysis;
  try {
    analysis = await analyzeDocument(text, domainConfig.prompt_instruction);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "AI 분석 중 오류가 발생했습니다.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  const bucket = process.env.STORAGE_BUCKET!;
  const filePath = `${user.id}/${Date.now()}_${file.name}`;
  await supabase.storage.from(bucket).upload(filePath, buffer, {
    contentType: file.type,
    upsert: false,
  });

  const suggestedQuestions = await generateSuggestedQuestions(analysis.title, analysis);

  const { data: analysisRow, error: analysisError } = await supabase
    .from("analyses")
    .insert({
      user_id: user.id,
      type: "document",
      title: analysis.title,
      content: { ...analysis, suggestedQuestions },
      domain: domainKey,
    })
    .select()
    .single();

  if (analysisError) {
    return NextResponse.json({ error: "저장 실패" }, { status: 500 });
  }

  await supabase.from("documents").insert({
    analysis_id: analysisRow.id,
    file_path: filePath,
    file_name: file.name,
    file_type: fileType,
    page_count: pageCount,
  });

  const month = new Date().toISOString().slice(0, 7);
  const { data: currentUsage } = await supabase
    .from("usage").select("count").eq("user_id", user.id).eq("month", month).maybeSingle();
  await supabase.from("usage").upsert(
    { user_id: user.id, month, count: (currentUsage?.count ?? 0) + 1 },
    { onConflict: "user_id,month" }
  );

  return NextResponse.json({ id: analysisRow.id, analysis });
}
