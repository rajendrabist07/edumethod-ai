import React from "react";
import { PrismIconProps } from "./types";

export function FlashcardsIcon({ size = 24, className = "", active = false, ...props }: PrismIconProps) {
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
      <rect x="4" y="6" width="16" height="14" rx="2" fill={active ? "currentColor" : "none"} stroke={active ? "none" : "currentColor"} /><path d="M8 2h12v12" />
    </svg>
  );
}

export default FlashcardsIcon;
