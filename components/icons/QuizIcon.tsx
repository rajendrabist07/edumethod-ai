import React from "react";
import { PrismIconProps } from "./types";

export function QuizIcon({ size = 24, className = "", active = false, ...props }: PrismIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <rect x="3" y="4" width="18" height="18" rx="2" fill={active ? "currentColor" : "none"} stroke={active ? "none" : "currentColor"} /><path d="M8 10h8" stroke={active ? "#fff" : "currentColor"} /><path d="M8 14h8" stroke={active ? "#fff" : "currentColor"} /><path d="M8 18h4" stroke={active ? "#fff" : "currentColor"} /><path d="M16 2v4" /><path d="M8 2v4" />
    </svg>
  );
}

export default QuizIcon;
