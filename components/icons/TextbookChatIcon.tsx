import React from "react";
import { PrismIconProps } from "./types";

export function TextbookChatIcon({ size = 24, className = "", active = false, ...props }: PrismIconProps) {
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
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" fill={active ? "currentColor" : "none"} stroke={active ? "none" : "currentColor"} /><path d="M8 7h6" stroke={active ? "#fff" : "currentColor"} /><path d="M8 11h8" stroke={active ? "#fff" : "currentColor"} />
    </svg>
  );
}

export default TextbookChatIcon;
