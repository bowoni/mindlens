"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function toggleStar(analysisId: string, current: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  await supabase
    .from("analyses")
    .update({ is_starred: !current })
    .eq("id", analysisId)
    .eq("user_id", user.id);

  revalidatePath("/dashboard");
}

export async function starAnalyses(ids: string[], star: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  await supabase
    .from("analyses")
    .update({ is_starred: star })
    .in("id", ids)
    .eq("user_id", user.id);

  revalidatePath("/dashboard");
}

export async function generateShareToken(id: string): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const token = crypto.randomUUID();
  await supabase
    .from("analyses")
    .update({ share_token: token })
    .eq("id", id)
    .eq("user_id", user.id);

  return token;
}

export async function revokeShareToken(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  await supabase
    .from("analyses")
    .update({ share_token: null })
    .eq("id", id)
    .eq("user_id", user.id);
}

export async function deleteAnalyses(ids: string[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  await supabase
    .from("analyses")
    .delete()
    .in("id", ids)
    .eq("user_id", user.id);

  revalidatePath("/dashboard");
}
