"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function cancelSubscription() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan, current_period_end")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  await supabase
    .from("subscriptions")
    .update({ cancel_at_period_end: true })
    .eq("user_id", user.id)
    .eq("status", "active");

  revalidatePath("/pricing");
  revalidatePath("/");

  return { currentPeriodEnd: sub?.current_period_end ?? null };
}
