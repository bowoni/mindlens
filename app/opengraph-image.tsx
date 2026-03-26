import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-end",
          background: "#09090b",
          padding: "72px 80px",
        }}
      >
        {/* 배경 장식 */}
        <div
          style={{
            position: "absolute",
            top: -200,
            right: -200,
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* 로고 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: "#6366f1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <span style={{ fontSize: 36, fontWeight: 700, color: "#f4f4f5" }}>
            MindLens
          </span>
        </div>

        {/* 타이틀 */}
        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            color: "#f4f4f5",
            lineHeight: 1.15,
            marginBottom: 24,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <span>문서도, 영상도</span>
          <span>
            모든 콘텐츠를{" "}
            <span style={{ color: "#818cf8" }}>이해하는 AI</span>
          </span>
        </div>

        {/* 태그 */}
        <div style={{ display: "flex", gap: 12 }}>
          {["문서 분석", "영상 분석", "AI Q&A", "팀 협업"].map((tag) => (
            <div
              key={tag}
              style={{
                padding: "8px 18px",
                borderRadius: 100,
                border: "1px solid rgba(129,140,248,0.3)",
                color: "#a5b4fc",
                fontSize: 18,
                display: "flex",
              }}
            >
              {tag}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
