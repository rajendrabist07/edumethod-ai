import React from "react";

interface IconProps {
  size?: number | string;
  className?: string;
}

export function CameraScanIcon({ size = 24, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Corner Bracket Frame indicating 'scanning' */}
      <path d="M4 8V5a1 1 0 0 1 1-1h3" />
      <path d="M20 8V5a1 1 0 0 0-1-1h-3" />
      <path d="M4 16v3a1 1 0 0 0 1 1h3" />
      <path d="M20 16v3a1 1 0 0 1-1 1h-3" />

      {/* Stylized camera in center */}
      <path d="M9 16h6a2 2 0 0 0 2-2V9.5a1.5 1.5 0 0 0-1.5-1.5h-1L13.5 6.5h-3L9.5 8h-1A1.5 1.5 0 0 0 7 9.5V14a2 2 0 0 0 2 2z" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

export default CameraScanIcon;
