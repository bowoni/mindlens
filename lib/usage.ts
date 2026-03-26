import { SupabaseClient } from "@supabase/supabase-js";

const FREE_LIMIT = Number(process.env.FREE_ANALYSIS_LIMIT ?? 5);

/**
 * 무료 플랜 사용량 초과 여부를 확인합니다.
 * Pro/Team 플랜이면 항상 false를 반환합니다.
 * @returns 초과했으면 true
 */
export async function isUsageLimitExceeded(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan, cancel_at_period_end, current_period_end")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  const isExpired =
    sub?.cancel_at_period_end &&
    sub.current_period_end &&
    new Date(sub.current_period_end) <= new Date();

  if (!isExpired && (sub?.plan === "pro" || sub?.plan === "team")) return false;

  const month = new Date().toISOString().slice(0, 7);
  const { data: usage } = await supabase
    .from("usage")
    .select("count")
    .eq("user_id", userId)
    .eq("month", month)
    .maybeSingle();

  return (usage?.count ?? 0) >= FREE_LIMIT;
}
