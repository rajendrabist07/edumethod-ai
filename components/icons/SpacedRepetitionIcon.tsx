import React from "react";

interface IconProps {
  size?: number | string;
  className?: string;
}

export function SpacedRepetitionIcon({ size = 24, className = "" }: IconProps) {
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
      {/* Dynamic loop indicating cycles/intervals */}
      <path d="M21.5 2v6h-6" />
      <path d="M21.34 8a10 10 0 1 0-.45 5.25" />
      
      {/* Clock arrows in center for time intervals */}
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

export default SpacedRepetitionIcon;
