import React from "react";

interface LogoProps {
  size?: number | string;
  className?: string;
  colored?: boolean;
}

export function Logo({ size = 32, className = "", colored = true }: LogoProps) {
  const gradientId = `logo-grad-${React.useId().replace(/:/g, "")}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none ${className}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="4" y1="8" x2="28" y2="26" gradientUnits="userSpaceOnUse">
          <stop stopColor={colored ? "var(--accent, #0F8B8D)" : "currentColor"} />
          <stop offset="0.55" stopColor={colored ? "var(--scholar-leaf, #2BA84A)" : "currentColor"} />
          <stop offset="1" stopColor={colored ? "var(--scholar-gold, #D9952F)" : "currentColor"} />
        </linearGradient>
      </defs>
      <path
        d="M5.2 8.8C8.5 8.2 11.7 8.8 16 11.1v14.2C12 23 8.5 22.4 5.2 23.1V8.8Z"
        fill={colored ? `url(#${gradientId})` : "none"}
        fillOpacity={colored ? 0.2 : 0}
        stroke={colored ? `url(#${gradientId})` : "currentColor"}
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M26.8 8.8C23.5 8.2 20.3 8.8 16 11.1v14.2C20 23 23.5 22.4 26.8 23.1V8.8Z"
        fill={colored ? `url(#${gradientId})` : "none"}
        fillOpacity={colored ? 0.28 : 0}
        stroke={colored ? `url(#${gradientId})` : "currentColor"}
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M16 11.1V25.3"
        stroke={colored ? `url(#${gradientId})` : "currentColor"}
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M10.2 18.2L13.1 15.2L16.2 17.6L22 11.4"
        stroke={colored ? `url(#${gradientId})` : "currentColor"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M22 11.4V15.4H18"
        stroke={colored ? `url(#${gradientId})` : "currentColor"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="10.2" cy="18.2" r="1.15" fill={colored ? "var(--accent, #0F8B8D)" : "currentColor"} />
      <circle cx="16.2" cy="17.6" r="1.15" fill={colored ? "var(--scholar-leaf, #2BA84A)" : "currentColor"} />
    </svg>
  );
}

export default Logo;
