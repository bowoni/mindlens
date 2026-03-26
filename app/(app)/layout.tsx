import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Sidebar from "@/components/sidebar";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: subscription }, { data: membership }] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("plan, status, cancel_at_period_end, current_period_end")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle(),
    supabase
      .from("team_members")
      .select("id, role, team_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle(),
  ]);

  const isExpired =
    subscription?.cancel_at_period_end &&
    subscription.current_period_end &&
    new Date(subscription.current_period_end) <= new Date();

  if (isExpired) {
    await supabase
      .from("subscriptions")
      .update({ status: "cancelled" })
      .eq("user_id", user.id)
      .eq("status", "active");

    if (subscription?.plan === "team") {
      const { data: team } = await supabase
        .from("teams")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();
      if (team) {
        await supabase.from("team_analyses").delete().eq("team_id", team.id);
        await supabase.from("team_members").delete().eq("team_id", team.id);
        await supabase.from("teams").delete().eq("id", team.id);
      }
    }
  }

  const plan = isExpired ? "free" : (subscription?.plan ?? "free");
  const isPro = plan === "pro" || plan === "team";
  const isTeam = plan === "team" || !!membership;
  const teamRole = membership?.role ?? (plan === "team" ? "owner" : null);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar user={user} isPro={isPro} isTeam={isTeam} teamRole={teamRole} />
      <main className="flex-1 overflow-y-auto pt-14 md:pt-0 print:overflow-visible print:h-auto print:pt-0">{children}</main>
    </div>
  );
}
