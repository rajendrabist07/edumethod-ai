import React from "react";

interface IconProps {
  size?: number | string;
  className?: string;
}

export function QuizTargetIcon({ size = 24, className = "" }: IconProps) {
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
      {/* Target concentric rings */}
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" strokeDasharray="3 3" opacity="0.6" />

      {/* Target center bullseye */}
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />

      {/* Checkmark crossing the target representing assessment completion */}
      <path d="M7.5 12.5l3 3 6.5-7" />
    </svg>
  );
}

export default QuizTargetIcon;
