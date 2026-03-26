"use client";

import { createClient } from "@/lib/supabase/client";

export default function SocialAuthButtons() {
  async function handleOAuth(provider: "google" | "kakao") {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground">또는</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <button
        type="button"
        onClick={() => handleOAuth("google")}
        className="w-full h-10 flex items-center justify-center gap-2.5 rounded-lg border border-border bg-background hover:bg-muted text-foreground text-sm font-medium transition-colors"
      >
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Google로 계속하기
      </button>

      <button
        type="button"
        onClick={() => handleOAuth("kakao")}
        className="w-full h-10 flex items-center justify-center gap-2.5 rounded-lg bg-[#FEE500] hover:bg-[#F5DC00] text-[#191919] text-sm font-medium transition-colors"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#191919">
          <path d="M12 3C6.477 3 2 6.477 2 10.8c0 2.7 1.62 5.076 4.08 6.48L5.04 21l4.8-2.88c.69.12 1.41.18 2.16.18 5.523 0 10-3.477 10-7.8S17.523 3 12 3z"/>
        </svg>
        카카오로 계속하기
      </button>
    </div>
  );
}
