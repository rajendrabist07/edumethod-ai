type BrandMarkProps = {
  compact?: boolean;
  className?: string;
};

export function BrandMark({ compact = false, className = "" }: BrandMarkProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`.trim()}>
      <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 p-[1px] shadow-lg shadow-blue-500/20">
        <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.45),_transparent_60%)]" />
        <svg
          viewBox="0 0 64 64"
          className="relative h-6 w-6 text-white"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M19 42.5V26.2c0-5.1 4.1-9.2 9.2-9.2h7.6c5.1 0 9.2 4.1 9.2 9.2v16.3"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M24 42.5V33c0-4.4 3.6-8 8-8h0c4.4 0 8 3.6 8 8v9.5"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="32" cy="20" r="4" fill="currentColor" />
          <path
            d="M18 18l6-6"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M46 18l-6-6"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M20 48h24"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {!compact ? (
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
            EduMethod AI
          </p>
          <p className="text-xs text-[color:var(--muted)]">
            AI-powered study planning
          </p>
        </div>
      ) : null}
    </div>
  );
}

export function FeatureIcon({ kind }: { kind: "spark" | "target" | "chart" }) {
  const common = "h-6 w-6 text-blue-600";

  if (kind === "spark") {
    return (
      <svg
        viewBox="0 0 24 24"
        className={common}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 2l1.6 5.3L19 9l-5.4 1.7L12 16l-1.6-5.3L5 9l5.4-1.7L12 2Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M18 15l.8 2.3L21 18l-2.2.7L18 21l-.8-2.3L15 18l2.2-.7L18 15Z"
          stroke="currentColor"
          strokeWidth="1.5"
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
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.7" />
        <circle cx="12" cy="12" r="4" fill="currentColor" />
        <path
          d="M12 4V2"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
        <path
          d="M12 22v-2"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
        <path
          d="M4 12H2"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
        <path
          d="M22 12h-2"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
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
        d="M5 18V9"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M12 18V5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M19 18v-6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M3 18h18"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}
