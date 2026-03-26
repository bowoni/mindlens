import { createClient } from "@/lib/supabase/server";
import PricingClient from "./pricing-client";

export const dynamic = "force-dynamic";

type PlanKey = "free" | "pro" | "team";

export default async function PricingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let initialPlan: PlanKey = "free";
  let cancelAtPeriodEnd = false;
  let currentPeriodEnd: string | null = null;

  if (user) {
    const { data } = await supabase
      .from("subscriptions")
      .select("plan, cancel_at_period_end, current_period_end")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    const isExpired =
      data?.cancel_at_period_end &&
      data.current_period_end &&
      new Date(data.current_period_end) <= new Date();

    if (!isExpired) {
      if (data?.plan === "team") initialPlan = "team";
      else if (data?.plan === "pro") initialPlan = "pro";
    }

    cancelAtPeriodEnd = !isExpired && (data?.cancel_at_period_end ?? false);
    currentPeriodEnd = data?.current_period_end ?? null;
  }

  return (
    <PricingClient
      initialPlan={initialPlan}
      cancelAtPeriodEnd={cancelAtPeriodEnd}
      currentPeriodEnd={currentPeriodEnd}
    />
  );
}
