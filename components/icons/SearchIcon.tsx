import React from "react";
import { PrismIconProps } from "./types";

export function SearchIcon({ size = 24, className = "", active = false, ...props }: PrismIconProps) {
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
      <circle cx="11" cy="11" r="8" fill={active ? "currentColor" : "none"} stroke={active ? "none" : "currentColor"} /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

export default SearchIcon;
