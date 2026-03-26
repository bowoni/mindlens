"use client";

import { useState } from "react";
import { generateShareToken, revokeShareToken } from "@/app/(app)/dashboard/actions";

type Props = {
  analysisId: string;
  shareToken: string | null;
};

export default function ShareButton({ analysisId, shareToken: initialToken }: Props) {
  const [token, setToken] = useState(initialToken);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const shareUrl = token ? `${typeof window !== "undefined" ? window.location.origin : ""}/share/${token}` : null;

  async function handleGenerate() {
    setLoading(true);
    const newToken = await generateShareToken(analysisId);
    setToken(newToken);
    setLoading(false);
    copyToClipboard(`${window.location.origin}/share/${newToken}`);
  }

  async function handleRevoke() {
    setLoading(true);
    await revokeShareToken(analysisId);
    setToken(null);
    setLoading(false);
  }

  function copyToClipboard(url: string) {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!token) {
    return (
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
          <polyline points="16 6 12 2 8 6"/>
          <line x1="12" y1="2" x2="12" y2="15"/>
        </svg>
        {loading ? "생성 중..." : "공유 링크 생성"}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => copyToClipboard(shareUrl!)}
        className="flex items-center gap-2 text-sm text-accent hover:opacity-80 transition-opacity"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {copied ? (
            <path d="M20 6L9 17l-5-5"/>
          ) : (
            <>
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </>
          )}
        </svg>
        {copied ? "복사됨!" : "링크 복사"}
      </button>
      <button
        onClick={handleRevoke}
        disabled={loading}
        className="text-sm text-muted-foreground hover:text-red-500 disabled:opacity-50 transition-colors"
      >
        공유 해제
      </button>
    </div>
  );
}
