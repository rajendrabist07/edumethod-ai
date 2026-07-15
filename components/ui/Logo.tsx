import React from "react";

interface LogoProps {
  size?: number | string;
  className?: string;
  colored?: boolean;
}

export function Logo({ size = 32, className = "", colored = true }: LogoProps) {
  const primaryStroke = colored ? "url(#logo-primary)" : "currentColor";
  const accentColor = colored ? "url(#logo-accent)" : "currentColor";

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
        {/* Modern dynamic gradients adapting to light/dark via CSS currentColor or hardcoded brand colors */}
        <linearGradient id="logo-primary" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" className="stop-color-primary" stopColor="var(--accent, #2563eb)" />
          <stop offset="100%" className="stop-color-secondary" stopColor="var(--accent-strong, #3b82f6)" />
        </linearGradient>
        <linearGradient id="logo-accent" x1="16" y1="4" x2="28" y2="16" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#a855f7" /> {/* Purple-500 */}
          <stop offset="100%" stopColor="#ec4899" /> {/* Pink-500 */}
        </linearGradient>
      </defs>

      {/* Structured learning: Left page (curved book foundation) */}
      <path
        d="M16 26C10 26 5 28 5 28V9C5 9 10 7 16 9"
        stroke={primaryStroke}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Structured learning: Ascending steps forming the right page */}
      <path
        d="M16 26H20V21H24V16H28V11C23.5 9.5 19.5 10 16 11"
        stroke={primaryStroke}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Neural AI spark/node at the peak of the steps */}
      <path
        d="M28 6.5C28 7.3 27.3 8 26.5 8C25.7 8 25 7.3 25 6.5C25 5.7 25.7 5 26.5 5C27.3 5 28 5.7 28 6.5Z"
        fill={accentColor}
      />
      
      {/* Dynamic starburst spark lines emanating from node */}
      <path
        d="M26.5 2V4M26.5 9v2M22 6.5h2M29 6.5h2"
        stroke={accentColor}
        strokeWidth="1.25"
        strokeLinecap="round"
      />
      
      {/* Book center spine crease */}
      <path
        d="M16 9V26"
        stroke={primaryStroke}
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.7"
      />
    </svg>
  );
}

export default Logo;
