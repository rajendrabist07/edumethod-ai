import React from "react";
import { PrismIconProps } from "./types";

export function MasteryMapIcon({ size = 24, className = "", active = false, ...props }: PrismIconProps) {
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
      <circle cx="18" cy="6" r="3" fill={active ? "currentColor" : "none"} stroke={active ? "none" : "currentColor"} /><circle cx="6" cy="18" r="3" fill={active ? "currentColor" : "none"} stroke={active ? "none" : "currentColor"} /><circle cx="18" cy="18" r="3" fill={active ? "currentColor" : "none"} stroke={active ? "none" : "currentColor"} /><path d="M18 9v6" /><path d="M9 18h6" /><path d="M8.12 15.88l7.76-7.76" />
    </svg>
  );
}

export default MasteryMapIcon;
