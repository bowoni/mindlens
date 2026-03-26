"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

const ROLE_OPTIONS = [
  { value: "viewer", label: "Viewer", desc: "팀 대시보드 조회만 가능" },
  { value: "contributor", label: "Member", desc: "분석을 팀에 추가 가능" },
  { value: "admin", label: "Admin", desc: "추가·제거 모두 가능" },
];

function RoleSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = ROLE_OPTIONS.find((o) => o.value === value) ?? ROLE_OPTIONS[1];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 flex items-center gap-2 min-w-[80px]"
      >
        {selected.label}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-[calc(100%+4px)] z-50 w-48 rounded-lg border border-border bg-background shadow-lg py-1">
          {ROLE_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => { onChange(o.value); setOpen(false); }}
              className={`w-full text-left px-3 py-2.5 transition-colors ${
                o.value === value
                  ? "bg-(--accent-subtle)"
                  : "hover:bg-muted"
              }`}
            >
              <p className={`text-sm font-medium ${o.value === value ? "text-accent" : "text-foreground"}`}>{o.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{o.desc}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

type Member = {
  id: string;
  user_email: string;
  role: string;
  status: string;
};

type ApiKey = {
  id: string;
  name: string;
  key_prefix: string;
  key_value: string;
  created_at: string;
  last_used_at: string | null;
};

type Team = {
  id: string;
  name: string;
  team_members: Member[];
};

export default function TeamSettingsPage() {
  const [team, setTeam] = useState<Team | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("contributor");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const [teamName, setTeamName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [keyName, setKeyName] = useState("");
  const [generatingKey, setGeneratingKey] = useState(false);
  const [newKeyRaw, setNewKeyRaw] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [visibleKeyId, setVisibleKeyId] = useState<string | null>(null);
  const [deletingTeam, setDeletingTeam] = useState(false);

  async function deleteTeam() {
    if (!confirm("팀을 삭제하면 모든 팀원과 팀 대시보드 데이터가 삭제됩니다. 계속하시겠습니까?")) return;
    setDeletingTeam(true);
    await fetch("/api/team", { method: "DELETE" });
    await fetchData();
    setDeletingTeam(false);
  }

  async function fetchData() {
    setLoading(true);
    const [teamRes, keysRes] = await Promise.all([
      fetch("/api/team").then((r) => r.json()),
      fetch("/api/team/api-keys").then((r) => r.json()),
    ]);
    setTeam(teamRes.team ?? null);
    setIsOwner(teamRes.role === "owner");
    setKeys(keysRes.keys ?? []);
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, []);

  async function createTeam() {
    if (!teamName.trim()) return;
    setCreating(true);
    setCreateError(null);
    const res = await fetch("/api/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: teamName.trim() }),
    });
    const data = await res.json();
    if (!res.ok) { setCreateError(data.error); setCreating(false); return; }
    await fetchData();
    setCreating(false);
    setTeamName("");
  }

  async function inviteMember() {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setInviteError(null);
    const res = await fetch("/api/team/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
    });
    const data = await res.json();
    if (!res.ok) { setInviteError(data.error); setInviting(false); return; }
    await fetchData();
    setInviting(false);
    setInviteEmail("");
  }

  async function removeMember(memberId: string) {
    if (!confirm("이 멤버를 팀에서 제거하시겠습니까?")) return;
    await fetch(`/api/team/members/${memberId}`, { method: "DELETE" });
    await fetchData();
  }

  async function generateKey() {
    if (!keyName.trim()) return;
    setGeneratingKey(true);
    const res = await fetch("/api/team/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: keyName.trim() }),
    });
    const data = await res.json();
    if (res.ok) {
      setNewKeyRaw(data.key.key_value);
      setKeyName("");
      await fetchData();
    }
    setGeneratingKey(false);
  }

  async function copyKeyValue(value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function revokeKey(keyId: string) {
    if (!confirm("이 API 키를 삭제하시겠습니까? 복구할 수 없습니다.")) return;
    await fetch(`/api/team/api-keys/${keyId}`, { method: "DELETE" });
    setKeys((prev) => prev.filter((k) => k.id !== keyId));
  }

  async function copyKey() {
    if (!newKeyRaw) return;
    await navigator.clipboard.writeText(newKeyRaw);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="space-y-3 animate-pulse">
          <div className="h-6 bg-muted rounded w-48" />
          <div className="h-4 bg-muted rounded w-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-10">
      <div className="flex items-center gap-3">
        <Link href="/team" className="text-muted-foreground hover:text-foreground transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </Link>
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">팀 설정</h1>
      </div>

      {/* 팀 없음 → 생성 */}
      {!team && (
        <section className="space-y-4 rounded-xl border border-border bg-card p-6">
          <h2 className="text-base font-semibold text-foreground">팀 만들기</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createTeam()}
              placeholder="팀 이름"
              className="flex-1 h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
            <button
              onClick={createTeam}
              disabled={creating || !teamName.trim()}
              className="px-4 h-10 rounded-lg bg-accent text-white text-sm font-medium hover:bg-(--accent-hover) disabled:opacity-50 transition-colors"
            >
              {creating ? "생성 중..." : "생성"}
            </button>
          </div>
          {createError && <p className="text-xs text-red-500">{createError}</p>}
        </section>
      )}

      {team && (
        <>
          {/* 팀원 관리 */}
          <section className="space-y-4 rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">팀원</h2>
              <span className="text-xs text-muted-foreground">{(team.team_members ?? []).filter((m) => m.status === "active").length} / 5명</span>
            </div>

            <ul className="space-y-2">
              {(team.team_members ?? []).map((m) => (
                <li key={m.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm text-foreground">{m.user_email}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {{ owner: "Leader", admin: "Admin", contributor: "Member", viewer: "Viewer" }[m.role] ?? m.role} · {m.status === "pending" ? "초대 대기 중" : "활성"}
                    </p>
                  </div>
                  {isOwner && m.role !== "owner" && (
                    <button
                      onClick={() => removeMember(m.id)}
                      className="text-xs text-red-500 hover:text-red-400 transition-colors"
                    >
                      제거
                    </button>
                  )}
                </li>
              ))}
            </ul>

            {isOwner && (
              <div className="space-y-2 pt-2">
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && inviteMember()}
                    placeholder="초대할 이메일"
                    className="flex-1 min-w-0 h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                  />
                  <RoleSelect value={inviteRole} onChange={setInviteRole} />
                  <button
                    onClick={inviteMember}
                    disabled={inviting || !inviteEmail.trim()}
                    className="shrink-0 px-4 h-10 rounded-lg bg-accent text-white text-sm font-medium hover:bg-(--accent-hover) disabled:opacity-50 transition-colors"
                  >
                    {inviting ? "초대 중..." : "초대"}
                  </button>
                </div>
                {inviteError && <p className="text-xs text-red-500">{inviteError}</p>}
              </div>
            )}
          </section>

          {/* API 키 관리 */}
          {isOwner && (
            <section className="space-y-4 rounded-xl border border-border bg-card p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-foreground">API 키</h2>
              </div>
              <p className="text-xs text-muted-foreground">
                외부 서비스나 스크립트에서 팀 분석 데이터를 가져올 수 있습니다.
              </p>

              {/* 새 키 발급 후 표시 */}
              {newKeyRaw && (
                <div className="rounded-lg border border-accent/30 bg-(--accent-subtle) p-4 space-y-3">
                  <p className="text-xs font-medium text-accent">키가 생성되었습니다.</p>
                  <div className="flex gap-2">
                    <code className="flex-1 text-xs font-mono text-foreground bg-background border border-border rounded px-2 py-1.5 truncate">
                      {newKeyRaw}
                    </code>
                    <button
                      onClick={copyKey}
                      className="shrink-0 px-3 h-8 rounded border border-border text-xs text-foreground hover:bg-muted transition-colors"
                    >
                      {copied ? "복사됨!" : "복사"}
                    </button>
                    <button
                      onClick={() => setNewKeyRaw(null)}
                      className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                  <div className="rounded-md bg-background border border-border px-3 py-2.5 space-y-1.5">
                    <p className="text-xs text-muted-foreground font-medium">사용 방법</p>
                    <p className="text-xs text-muted-foreground">아래 헤더를 요청에 포함하세요.</p>
                    <code className="block text-xs font-mono text-foreground">
                      Authorization: Bearer {newKeyRaw}
                    </code>
                    <p className="text-xs text-muted-foreground pt-1">엔드포인트: <code className="text-foreground">GET /api/v1/analyses</code></p>
                  </div>
                </div>
              )}

              {/* 기존 키 목록 */}
              {keys.length > 0 && (
                <ul className="space-y-3">
                  {keys.map((k) => {
                    const isVisible = visibleKeyId === k.id;
                    return (
                      <li key={k.id} className="rounded-lg border border-border bg-background p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-foreground font-medium">{k.name}</p>
                          <button
                            onClick={() => revokeKey(k.id)}
                            className="text-xs text-red-500 hover:text-red-400 transition-colors"
                          >
                            삭제
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 text-xs font-mono text-muted-foreground bg-muted rounded px-2 py-1.5 truncate">
                            {isVisible ? k.key_value : "•".repeat(36)}
                          </code>
                          <button
                            onClick={() => setVisibleKeyId(isVisible ? null : k.id)}
                            className="shrink-0 p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            title={isVisible ? "숨기기" : "보기"}
                          >
                            {isVisible ? (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
                              </svg>
                            ) : (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                              </svg>
                            )}
                          </button>
                          <button
                            onClick={() => copyKeyValue(k.key_value)}
                            className="shrink-0 p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            title="복사"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                            </svg>
                          </button>
                        </div>
                        {k.last_used_at && (
                          <p className="text-xs text-muted-foreground">마지막 사용: {new Date(k.last_used_at).toLocaleDateString("ko-KR")}</p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}

              {/* 새 키 생성 */}
              <div className="flex gap-2 pt-2">
                <input
                  type="text"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && generateKey()}
                  placeholder="키 이름"
                  className="flex-1 h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
                <button
                  onClick={generateKey}
                  disabled={generatingKey || !keyName.trim()}
                  className="px-4 h-10 rounded-lg bg-accent text-white text-sm font-medium hover:bg-(--accent-hover) disabled:opacity-50 transition-colors"
                >
                  {generatingKey ? "생성 중..." : "발급"}
                </button>
              </div>
            </section>
          )}

          {/* 팀 삭제 */}
          {isOwner && (
            <section className="space-y-4 rounded-xl border border-red-500/20 bg-card p-6">
              <h2 className="text-base font-semibold text-foreground">팀 삭제</h2>
              <p className="text-xs text-muted-foreground">
                팀을 삭제하면 모든 팀원, 팀 대시보드 데이터가 영구적으로 삭제됩니다.
              </p>
              <button
                onClick={deleteTeam}
                disabled={deletingTeam}
                className="px-4 h-9 rounded-lg border border-red-500/40 text-red-500 hover:bg-red-500/10 text-sm font-medium disabled:opacity-50 transition-colors"
              >
                {deletingTeam ? "삭제 중..." : "팀 삭제"}
              </button>
            </section>
          )}
        </>
      )}
    </div>
  );
}
