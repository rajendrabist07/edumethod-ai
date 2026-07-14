type BrandMarkProps = {
  compact?: boolean;
  className?: string;
};

export function BrandMark({ compact = false, className = "" }: BrandMarkProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`.trim()}>
      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 p-[1.5px] shadow-lg shadow-blue-500/15 transition-transform duration-300 hover:scale-105">
        <div className="absolute inset-0 rounded-xl bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.4),_transparent_55%)]" />
        <svg
          viewBox="0 0 64 64"
          className="relative h-5.5 w-5.5 text-white"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Stylized Mortarboard Cap */}
          <path
            d="M32 14L50 23L32 32L14 23L32 14Z"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Under-cap body indicating Structure/Method */}
          <path
            d="M20 26.5V38.5C20 44 25.4 48 32 48C38.6 48 44 44 44 38.5V26.5"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Tassel */}
          <path
            d="M45 24.5V34"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="45" cy="36" r="2.5" fill="currentColor" />
          {/* Smart Nodes */}
          <circle cx="32" cy="23" r="3" fill="currentColor" />
        </svg>
      </div>

      {!compact ? (
        <div className="flex flex-col justify-center">
          <p className="text-sm font-black uppercase tracking-[0.25em] bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">
            EduMethod AI
          </p>
          <p className="text-[10px] font-bold tracking-wide text-[color:var(--muted)]">
            AI-POWERED COGNITION
          </p>
        </div>
      ) : null}
    </div>
  );
}

export function FeatureIcon({ kind }: { kind: "spark" | "target" | "chart" }) {
  const common = "h-5 w-5 text-blue-600 dark:text-blue-400 transition-transform duration-300 group-hover:scale-110";

  if (kind === "spark") {
    return (
      <svg
        viewBox="0 0 24 24"
        className={common}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 2L15 8L21 9.5L16.5 14.5L18 21L12 17.5L6 21L7.5 14.5L3 9.5L9 8L12 2Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (kind === "target") {
    return (
      <svg
        viewBox="0 0 24 24"
        className={common}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      className={common}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3 3V21H21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7 16L12 11L16 15L21 8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
