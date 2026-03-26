import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { paymentKey, orderId, amount, plan = "pro" } = await request.json();

  const secretKey = process.env.TOSS_SECRET_KEY!;
  const encoded = Buffer.from(secretKey + ":").toString("base64");

  const tossRes = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
    method: "POST",
    headers: {
      Authorization: `Basic ${encoded}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ paymentKey, orderId, amount }),
  });

  if (!tossRes.ok) {
    const err = await tossRes.json();
    return NextResponse.json({ error: err.message ?? "결제 승인 실패", code: err.code, detail: err }, { status: 400 });
  }

  const currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await supabase.from("subscriptions").upsert(
    {
      user_id: user.id,
      plan,
      status: "active",
      payment_key: paymentKey,
      order_id: orderId,
      amount,
      current_period_end: currentPeriodEnd,
      cancel_at_period_end: false,
    },
    { onConflict: "order_id" }
  );

  return NextResponse.json({ success: true });
}
