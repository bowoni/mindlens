"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Item = { id: string; type: string; title: string; created_at: string };

const TYPE_HREF: Record<string, (id: string) => string> = {
  document: (id) => `/analyze/document/${id}`,
  video: (id) => `/analyze/video/${id}`,
  comparison: (id) => `/compare/${id}`,
};

const TYPE_LABEL: Record<string, string> = {
  document: "문서", video: "영상", comparison: "비교",
};

const TYPE_COLOR: Record<string, string> = {
  document: "text-accent",
  video: "text-amber-500",
  comparison: "text-purple-500",
};

export default function RecentAnalysesSidebar({
  type,
  title = "최근 분석",
}: {
  type?: string | string[];
  title?: string;
}) {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    const supabase = createClient();
    const types = type ? (Array.isArray(type) ? type : [type]) : ["document", "video", "comparison"];
    supabase
      .from("analyses")
      .select("id, type, title, created_at")
      .in("type", types)
      .order("created_at", { ascending: false })
      .limit(8)
      .then(({ data }) => setItems(data ?? []));
  }, [type]);

  return (
    <aside className="space-y-3">
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</h2>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground px-3 py-2.5">최근 분석한 내역이 없습니다.</p>
      ) : (
      <div className="space-y-1">
        {items.map((item) => (
          <Link
            key={item.id}
            href={TYPE_HREF[item.type]?.(item.id) ?? "#"}
            className="flex items-start gap-2.5 rounded-lg px-3 py-2.5 hover:bg-muted transition-colors group"
          >
            <span className={`text-xs font-medium shrink-0 mt-0.5 ${TYPE_COLOR[item.type]}`}>
              {TYPE_LABEL[item.type]}
            </span>
            <div className="min-w-0">
              <p className="text-sm text-foreground line-clamp-2 group-hover:text-accent transition-colors leading-snug">
                {item.title}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {new Date(item.created_at).toLocaleDateString("ko-KR")}
              </p>
            </div>
          </Link>
        ))}
      </div>
      )}
    </aside>
  );
}
