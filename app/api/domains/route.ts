import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("domain_configs")
    .select("key, label, description")
    .order("sort_order");

  if (error) {
    return NextResponse.json({ error: "도메인 설정을 불러오지 못했습니다." }, { status: 500 });
  }

  return NextResponse.json(data);
}
