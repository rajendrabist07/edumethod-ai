import React from "react";
import { PrismIconProps } from "./types";

export function NotificationIcon({ size = 24, className = "", active = false, ...props }: PrismIconProps) {
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
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" fill={active ? "currentColor" : "none"} stroke={active ? "none" : "currentColor"} /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

export default NotificationIcon;
