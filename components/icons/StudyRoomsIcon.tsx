import React from "react";
import { PrismIconProps } from "./types";

export function StudyRoomsIcon({ size = 24, className = "", active = false, ...props }: PrismIconProps) {
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
      <circle cx="9" cy="7" r="4" fill={active ? "currentColor" : "none"} stroke={active ? "none" : "currentColor"} /><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" fill={active ? "currentColor" : "none"} stroke={active ? "none" : "currentColor"} /><path d="M16 3.13a4 4 0 0 1 0 7.75" /><path d="M21 21v-2a4 4 0 0 0-3-3.85" />
    </svg>
  );
}

export default StudyRoomsIcon;
