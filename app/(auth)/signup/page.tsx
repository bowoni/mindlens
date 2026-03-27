"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import AuthLayout from "@/components/auth-layout";
import SocialAuthButtons from "@/components/social-auth-buttons";
import { translateAuthError } from "@/lib/auth-error";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((v) => v - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  async function handleResend() {
    setResending(true);
    const supabase = createClient();
    await supabase.auth.resend({ type: "signup", email, options: { emailRedirectTo: `${location.origin}/auth/callback` } });
    setResending(false);
    setResendCooldown(60);
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    });

    if (error) {
      setError(translateAuthError(error.message));
      setLoading(false);
      return;
    }

    setDone(true);
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 rounded-full bg-(--accent-subtle) flex items-center justify-center mx-auto mb-4">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">이메일을 확인해주세요</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            <span className="text-foreground font-medium">{email}</span>로 인증 링크를 보냈어요.
            <br />링크를 클릭하면 로그인됩니다.
          </p>
          <button
            onClick={handleResend}
            disabled={resending || resendCooldown > 0}
            className="mt-6 text-sm text-accent hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resending ? "전송 중..." : resendCooldown > 0 ? `다시 보내기 (${resendCooldown}초)` : "인증 메일 다시 보내기"}
          </button>
          <Link href="/login" className="block mt-3 text-sm text-muted-foreground hover:underline">
            로그인 페이지로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <AuthLayout
      heading={<>무료로 시작하고<br />더 깊이 분석하세요</>}
      subtext="이메일 또는 소셜 계정으로 바로 시작할 수 있어요."
    >
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">회원가입</h1>
          <p className="text-sm text-muted-foreground mt-1">무료로 시작하세요</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-shadow"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              placeholder="6자 이상"
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-shadow"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg px-3 py-2.5">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 rounded-lg bg-accent hover:bg-(--accent-hover) disabled:opacity-50 text-white text-sm font-medium transition-colors"
          >
            {loading ? "가입 중..." : "회원가입"}
          </button>
        </form>

        <div className="mt-3"><SocialAuthButtons /></div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          이미 계정이 있으신가요?{" "}
          <Link href="/login" className="text-accent hover:underline font-medium">
            로그인
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
