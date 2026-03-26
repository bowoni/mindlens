"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";

function FailContent() {
  const searchParams = useSearchParams();
  const message = searchParams.get("message") ?? "결제가 취소되었거나 실패했습니다.";

  return (
    <div className="text-center max-w-sm">
      <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center mx-auto mb-4">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-foreground mb-2">결제 실패</h2>
      <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{message}</p>
      <div className="flex gap-3 justify-center">
        <Link
          href="/pricing"
          className="px-5 py-2.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-(--accent-hover) transition-colors"
        >
          다시 시도
        </Link>
        <Link
          href="/dashboard"
          className="px-5 py-2.5 rounded-lg border border-border text-sm text-foreground hover:bg-muted transition-colors"
        >
          대시보드로
        </Link>
      </div>
    </div>
  );
}

export default function PaymentFailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <Suspense>
        <FailContent />
      </Suspense>
    </div>
  );
}
