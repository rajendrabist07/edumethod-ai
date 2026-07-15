import React from "react";

interface IconProps {
  size?: number | string;
  className?: string;
}

export function PathProgressIcon({ size = 24, className = "" }: IconProps) {
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
      {/* Calendar page in background */}
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4" />
      <path d="M8 2v4" />
      <path d="M3 10h18" />

      {/* Ascending steps with arrow progression in the main calendar grid area */}
      <path d="M6 18h3.5v-3H13v-3h3.5" />
      <path d="M16.5 12H19" />
      
      {/* Arrowhead showing completion/progression */}
      <path d="M17 10l2 2-2 2" />
    </svg>
  );
}

export default PathProgressIcon;
