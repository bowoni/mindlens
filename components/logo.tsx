export function LensIcon({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* 외곽 원 */}
      <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="1.5" />
      {/* 중간 원 */}
      <circle cx="16" cy="16" r="8" stroke="currentColor" strokeWidth="1.5" />
      {/* 중심 원 */}
      <circle cx="16" cy="16" r="2.5" fill="currentColor" />
      {/* 십자선 */}
      <line x1="16" y1="2" x2="16" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="16" y1="24" x2="16" y2="30" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="2" y1="16" x2="8" y2="16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="24" y1="16" x2="30" y2="16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-xl bg-accent text-white"
      style={{ width: size, height: size }}
    >
      <LensIcon size={Math.round(size * 0.6)} />
    </div>
  );
}

export function LogoFull({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className ?? ""}`}>
      <LogoMark size={32} />
      <span className="font-semibold text-foreground tracking-tight">MindLens</span>
    </div>
  );
}
