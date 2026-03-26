"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    const paymentKey = searchParams.get("paymentKey");
    const orderId = searchParams.get("orderId");
    const amount = searchParams.get("amount");
    const plan = searchParams.get("plan") ?? "pro";

    if (!paymentKey || !orderId || !amount) {
      setStatus("error");
      return;
    }

    fetch("/api/payment/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentKey, orderId, amount: Number(amount), plan }),
    })
      .then((r) => r.json())
      .then((data) => setStatus(data.success ? "success" : "error"))
      .catch(() => setStatus("error"));
  }, [searchParams]);

  if (status === "loading") {
    return (
      <div className="text-center">
        <div className="w-12 h-12 rounded-full bg-(--accent-subtle) flex items-center justify-center mx-auto mb-4 animate-pulse">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
          </svg>
        </div>
        <p className="text-sm text-muted-foreground">결제를 확인하는 중입니다...</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="text-center">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">결제 확인 실패</h2>
        <p className="text-sm text-muted-foreground mb-6">결제 처리 중 오류가 발생했습니다.</p>
        <Link href="/pricing" className="text-sm text-accent hover:underline">다시 시도하기</Link>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="w-12 h-12 rounded-full bg-(--accent-subtle) flex items-center justify-center mx-auto mb-4">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6L9 17l-5-5"/>
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-foreground mb-2">Pro 구독 완료!</h2>
      <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
        MindLens Pro가 활성화되었습니다.<br />무제한 분석을 즐기세요.
      </p>
      <Link
        href="/dashboard"
        className="inline-block px-5 py-2.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-(--accent-hover) transition-colors"
      >
        대시보드로 이동
      </Link>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <Suspense>
        <SuccessContent />
      </Suspense>
    </div>
  );
}
