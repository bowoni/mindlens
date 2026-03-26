"use client";

import { useState } from "react";
import { loadTossPayments } from "@tosspayments/tosspayments-sdk";
import { createClient } from "@/lib/supabase/client";
import { cancelSubscription } from "./actions";

type PlanKey = "free" | "pro" | "team";

const PLANS = [
  {
    key: "free" as PlanKey,
    name: "무료",
    price: "₩0",
    period: "영구 무료",
    features: [
      "월 5회 분석",
      "문서 분석 (PDF/DOCX)",
      "영상 분석 (YouTube)",
      "비교 분석",
      "AI Q&A 채팅",
      "7일 히스토리",
    ],
    disabled: ["무제한 분석", "내보내기 (PDF/Markdown)", "도메인 특화 모드 전체", "공유 링크"],
    cta: "Pro 시작하기",
    highlight: false,
  },
  {
    key: "pro" as PlanKey,
    name: "Pro",
    price: "₩9,900",
    period: "/ 월",
    features: [
      "무제한 분석",
      "문서 분석 (PDF/DOCX)",
      "영상 분석 (YouTube)",
      "비교 분석",
      "AI Q&A 채팅",
      "무제한 히스토리",
      "내보내기 (PDF/Markdown)",
      "도메인 특화 모드 전체",
      "공유 링크",
      "관련 콘텐츠 추천",
    ],
    disabled: [],
    cta: "Pro 시작하기",
    highlight: true,
  },
  {
    key: "team" as PlanKey,
    name: "Team",
    price: "₩29,900",
    period: "/ 월",
    features: [
      "Pro 기능 전체",
      "팀원 최대 5명",
      "팀 공유 대시보드",
      "API 키 발급",
      "팀 분석 히스토리",
    ],
    disabled: [],
    cta: "Team 시작하기",
    highlight: false,
  },
];

export default function PricingClient({
  initialPlan,
  cancelAtPeriodEnd,
  currentPeriodEnd,
}: {
  initialPlan: PlanKey;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
}) {
  const [proLoading, setProLoading] = useState(false);
  const [teamLoading, setTeamLoading] = useState(false);
  const [downgrading, setDowngrading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<PlanKey>(initialPlan);
  const [isCancelled, setIsCancelled] = useState(cancelAtPeriodEnd);
  const [periodEnd, setPeriodEnd] = useState<string | null>(currentPeriodEnd);
  const [activeTab, setActiveTab] = useState<PlanKey>(initialPlan === "free" ? "pro" : initialPlan);

  async function handleDowngrade(targetPlan: PlanKey = "free") {
    const isTeamDowngrade = currentPlan === "team";
    let confirmMsg = targetPlan === "pro"
      ? "Pro 플랜으로 다운그레이드하시겠습니까?"
      : "무료 플랜으로 다운그레이드하시겠습니까?";

    if (isTeamDowngrade) {
      confirmMsg =
        "팀 플랜을 해지하면 현재 결제 기간이 끝난 후 팀과 팀 대시보드가 삭제됩니다.\n" +
        "기간이 끝날 때까지 팀 기능과 무제한 분석을 계속 사용할 수 있습니다.\n\n" +
        "계속하시겠습니까?";
    }

    if (!confirm(confirmMsg)) return;
    setDowngrading(true);
    setError(null);
    try {
      const result = await cancelSubscription();
      setIsCancelled(true);
      setPeriodEnd(result.currentPeriodEnd);
      if (targetPlan === "pro") {
        await requestPayment("pro");
      }
    } catch {
      setError("다운그레이드 중 오류가 발생했습니다.");
    } finally {
      setDowngrading(false);
    }
  }

  async function requestPayment(planKey: "pro" | "team") {
    const isProPlan = planKey === "pro";
    const setter = isProPlan ? setProLoading : setTeamLoading;
    setter(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("로그인이 필요합니다.");

      const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!;
      const tossPayments = await loadTossPayments(clientKey);
      const payment = tossPayments.payment({ customerKey: user.id });
      const orderId = `order_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      await payment.requestPayment({
        method: "CARD",
        amount: { currency: "KRW", value: isProPlan ? 9900 : 29900 },
        orderId,
        orderName: isProPlan ? "MindLens Pro 월간 구독" : "MindLens Team 월간 구독",
        successUrl: `${window.location.origin}/payment/success?plan=${planKey}`,
        failUrl: `${window.location.origin}/payment/fail`,
        customerEmail: user.email,
      });
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      const cancelled = err.code === "PAY_PROCESS_CANCELED" || err.code === "USER_CANCEL";
      if (!cancelled && err.message) setError(err.message);
      setter(false);
    }
  }

  function renderButton(planKey: PlanKey) {
    if (planKey === currentPlan) {
      return (
        <div className="space-y-1.5">
          <button
            disabled
            className="w-full h-11 rounded-xl border border-accent text-sm text-accent font-semibold cursor-default"
          >
            현재 플랜
          </button>
          {isCancelled && periodEnd && planKey !== "free" && (
            <p className="text-xs text-center text-muted-foreground">
              {new Date(periodEnd).toLocaleDateString("ko-KR", { month: "long", day: "numeric" })}에 무료 플랜으로 전환됩니다
            </p>
          )}
        </div>
      );
    }

    if (planKey === "free") {
      if (isCancelled) return null;
      return (
        <button
          onClick={() => handleDowngrade("free")}
          disabled={downgrading}
          className="w-full h-11 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 disabled:opacity-50 transition-colors"
        >
          {downgrading ? "처리 중..." : "무료로 다운그레이드"}
        </button>
      );
    }

    if (planKey === "pro" && currentPlan === "team") {
      if (isCancelled) return null;
      return (
        <button
          onClick={() => handleDowngrade("pro")}
          disabled={downgrading}
          className="w-full h-11 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 disabled:opacity-50 transition-colors"
        >
          {downgrading ? "처리 중..." : "Pro로 다운그레이드"}
        </button>
      );
    }

    const isProPlan = planKey === "pro";
    return (
      <button
        onClick={() => requestPayment(planKey)}
        disabled={proLoading || teamLoading}
        className="w-full h-11 rounded-xl bg-accent hover:bg-(--accent-hover) disabled:opacity-50 text-white text-sm font-semibold transition-colors"
      >
        {(isProPlan ? proLoading : teamLoading) ? "처리 중..." : PLANS.find((p) => p.key === planKey)!.cta}
      </button>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-semibold text-foreground tracking-tight">플랜 선택</h1>
        <p className="text-muted-foreground mt-2">필요에 맞는 플랜을 선택하세요</p>
      </div>

      {/* 모바일 탭 */}
      <div className="flex md:hidden rounded-full bg-muted p-1 mb-6">
        {PLANS.map((plan) => (
          <button
            key={plan.key}
            onClick={() => setActiveTab(plan.key)}
            className={`flex-1 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === plan.key
                ? "bg-background shadow-sm text-foreground font-semibold"
                : "text-muted-foreground"
            }`}
          >
            {plan.name}
          </button>
        ))}
      </div>

      <div className="md:grid md:grid-cols-3 md:gap-6 space-y-6 md:space-y-0">
        {PLANS.map((plan) => (
          <div
            key={plan.key}
            className={`rounded-2xl border p-6 flex flex-col ${
              plan.highlight && currentPlan === "free"
                ? "border-accent bg-(--accent-subtle)"
                : "border-border bg-card"
            } ${plan.key !== activeTab ? "hidden md:flex" : ""}`}
          >
            {plan.highlight && currentPlan === "free" && (
              <span className="self-start text-xs font-semibold px-2.5 py-1 rounded-full bg-accent text-white mb-4">
                추천
              </span>
            )}

            <div className="mb-6">
              <h2 className="text-lg font-semibold text-foreground">{plan.name}</h2>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                <span className="text-sm text-muted-foreground">{plan.period}</span>
              </div>
            </div>

            <ul className="space-y-2.5 flex-1 mb-8">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-foreground">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent shrink-0">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                  {f}
                </li>
              ))}
              {plan.disabled.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-muted-foreground/50 line-through">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                  {f}
                </li>
              ))}
            </ul>

            {renderButton(plan.key)}
          </div>
        ))}
      </div>

      {error && (
        <p className="mt-4 text-center text-sm text-red-500">{error}</p>
      )}

      <p className="text-center text-xs text-muted-foreground mt-8">
        테스트 환경에서는 실제 결제가 이루어지지 않습니다. 언제든지 취소 가능합니다.
      </p>
    </div>
  );
}
