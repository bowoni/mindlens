"use client";

import { useState, useRef, useEffect } from "react";

type Message = { role: "user" | "assistant"; content: string };

export default function AnalysisChat({ analysisId, suggestedQuestions: initialSuggestions }: { analysisId: string; suggestedQuestions?: string[] }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>(initialSuggestions ?? []);
  const [suggestionsLoaded, setSuggestionsLoaded] = useState(!!initialSuggestions?.length);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => inputRef.current?.focus(), 50);

      if (!suggestionsLoaded) {
        setSuggestionsLoaded(true);
        fetch("/api/suggest-questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ analysisId }),
        })
          .then((r) => (r.ok ? r.json() : { questions: [] }))
          .then(({ questions }) => setSuggestions(questions ?? []))
          .catch(() => setSuggestions([]));
      }
    }
  }, [open, messages, analysisId, suggestionsLoaded]);

  async function handleSubmit(e: React.FormEvent, overrideQuestion?: string) {
    e.preventDefault();
    const question = overrideQuestion ?? input.trim();
    if (!question || loading) return;
    setSuggestions([]);

    const newMessages: Message[] = [...messages, { role: "user", content: question }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ analysisId, messages: newMessages }),
    });

    if (!res.ok || !res.body) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "오류가 발생했습니다. 다시 시도해주세요." },
      ]);
      setLoading(false);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let assistantText = "";

    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      assistantText += decoder.decode(value, { stream: true });
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: assistantText };
        return updated;
      });
    }

    setLoading(false);
  }

  return (
    <div className="print:hidden">
      {/* 플로팅 버튼 */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-accent hover:bg-(--accent-hover) text-white shadow-lg flex items-center justify-center transition-colors"
        aria-label="AI에게 질문하기"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 0 2 2z"/>
        </svg>
      </button>

      {/* 오버레이 */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:bg-transparent"
          onClick={() => setOpen(false)}
        />
      )}

      {/* 채팅 패널 — 모바일: 하단 시트 / 데스크탑: 우측 고정 패널 */}
      <div
        className={`fixed z-50 bg-background border-border flex flex-col transition-transform duration-200
          bottom-0 left-0 right-0 h-[70vh] rounded-t-2xl border-t
          md:bottom-6 md:right-6 md:left-auto md:w-80 md:h-[480px] md:rounded-2xl md:border
          ${open ? "translate-y-0 opacity-100 pointer-events-auto" : "translate-y-full opacity-0 pointer-events-none"}`}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent" />
            <span className="text-sm font-medium text-foreground">AI 질문</span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* 메시지 목록 */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {messages.length === 0 && (
            <div className="mt-6 space-y-3">
              <p className="text-xs text-muted-foreground text-center">
                분석 내용에 대해 무엇이든 물어보세요.
              </p>
              {suggestions.length > 0 && (
                <div className="space-y-2">
                  {suggestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={(e) => { setInput(q); handleSubmit(e as unknown as React.FormEvent, q); }}
                      className="w-full text-left text-xs px-3 py-2 rounded-lg border border-border hover:border-accent/50 hover:bg-(--accent-subtle) text-muted-foreground hover:text-foreground transition-colors leading-snug"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
              {suggestions.length === 0 && suggestionsLoaded && (
                <p className="text-xs text-muted-foreground/50 text-center">질문을 불러오는 중...</p>
              )}
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-accent text-white"
                    : "bg-muted text-foreground"
                }`}
              >
                {msg.content || (
                  <span className="inline-flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]" />
                  </span>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* 입력창 */}
        <form onSubmit={handleSubmit} className="flex gap-2 px-4 py-3 border-t border-border shrink-0">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder="질문을 입력하세요..."
            className="flex-1 h-9 px-3 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-shadow disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="h-9 w-9 rounded-lg bg-accent hover:bg-(--accent-hover) disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
