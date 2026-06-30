type Props = {
  size?: number;
  className?: string;
  withGradient?: boolean;
};

// A premium, custom bot mark — geometric robot head with subtle facets.
// Replaces the generic Sparkles "AI" icon throughout the app.
export function BotMark({ size = 20, className = "", withGradient = true }: Props) {
  const stroke = withGradient ? "url(#bm-stroke)" : "currentColor";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id="bm-stroke" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--primary, #7c5cff)" />
          <stop offset="100%" stopColor="var(--secondary, #b07cff)" />
        </linearGradient>
        <linearGradient id="bm-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--primary, #7c5cff)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="var(--secondary, #b07cff)" stopOpacity="0.06" />
        </linearGradient>
      </defs>

      {/* antenna */}
      <path d="M16 3.2 V6.2" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="16" cy="2.6" r="1.3" fill={stroke} />

      {/* head */}
      <path
        d="M9 7.5 H23 a3 3 0 0 1 3 3 V21 a3 3 0 0 1 -3 3 H17.5 L16 26 L14.5 24 H9 a3 3 0 0 1 -3 -3 V10.5 a3 3 0 0 1 3 -3 Z"
        fill={withGradient ? "url(#bm-fill)" : "none"}
        stroke={stroke}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />

      {/* eyes */}
      <circle cx="12.4" cy="14.6" r="1.5" fill={stroke} />
      <circle cx="19.6" cy="14.6" r="1.5" fill={stroke} />

      {/* mouth bar */}
      <path
        d="M12 19 H20"
        stroke={stroke}
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.55"
      />

      {/* side ports */}
      <path d="M6 13 V18" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" opacity="0.55" />
      <path d="M26 13 V18" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" opacity="0.55" />
    </svg>
  );
}

export default BotMark;
