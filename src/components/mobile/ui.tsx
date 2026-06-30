import type { ReactNode } from "react";

export function GlassCard({
  children,
  className = "",
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`glass rounded-[22px] p-5 tap ${onClick ? "cursor-pointer" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

export function Pill({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "primary" | "purple" | "warn" | "success" }) {
  const tones: Record<string, string> = {
    default: "bg-glass text-muted-foreground",
    primary: "bg-[color-mix(in_oklab,var(--primary)_18%,transparent)] text-[color:var(--primary)]",
    purple: "bg-[color-mix(in_oklab,var(--secondary)_18%,transparent)] text-[color:var(--secondary)]",
    warn: "bg-[color-mix(in_oklab,var(--warning)_18%,transparent)] text-[color:var(--warning)]",
    success: "bg-[color-mix(in_oklab,var(--success)_18%,transparent)] text-[color:var(--success)]",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium tracking-tight ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function ProgressRing({ value, size = 56, stroke = 5, label }: { value: number; size?: number; stroke?: number; label?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--hairline)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#g)"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 700ms cubic-bezier(0.2,0.8,0.2,1)" }}
        />
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--primary)" />
            <stop offset="100%" stopColor="var(--secondary)" />
          </linearGradient>
        </defs>
      </svg>
      <span className="absolute mono text-[11px] font-medium">{label ?? `${value}%`}</span>
    </div>
  );
}

export function PrimaryButton({
  children,
  className = "",
  onClick,
  type = "button",
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`tap gradient-primary text-white font-medium rounded-[18px] px-5 py-3.5 text-[15px] shadow-[0_10px_30px_-12px_color-mix(in_oklab,var(--primary)_60%,transparent)] ${className}`}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  className = "",
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`tap glass rounded-[18px] px-5 py-3.5 text-[15px] font-medium ${className}`}
    >
      {children}
    </button>
  );
}

export function Sparkline({ data, height = 60 }: { data: number[]; height?: number }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const w = 300;
  const step = w / (data.length - 1);
  const norm = (v: number) => height - ((v - min) / (max - min || 1)) * (height - 6) - 3;
  const d = data.map((v, i) => `${i === 0 ? "M" : "L"} ${i * step} ${norm(v)}`).join(" ");
  const area = `${d} L ${w} ${height} L 0 ${height} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="sl" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.45" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#sl)" />
      <path d={d} fill="none" stroke="url(#g2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <defs>
        <linearGradient id="g2" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--primary)" />
          <stop offset="100%" stopColor="var(--secondary)" />
        </linearGradient>
      </defs>
    </svg>
  );
}
