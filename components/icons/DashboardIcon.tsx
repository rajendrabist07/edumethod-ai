import React from "react";
import { PrismIconProps } from "./types";

export function DashboardIcon({ size = 24, className = "", active = false, ...props }: PrismIconProps) {
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
      {active ? <rect x="3" y="3" width="7" height="7" rx="1.5" fill="currentColor" stroke="none" /> : <rect x="3" y="3" width="7" height="7" rx="1.5" />}{active ? <rect x="14" y="3" width="7" height="7" rx="1.5" fill="currentColor" stroke="none" /> : <rect x="14" y="3" width="7" height="7" rx="1.5" />}{active ? <rect x="14" y="14" width="7" height="7" rx="1.5" fill="currentColor" stroke="none" /> : <rect x="14" y="14" width="7" height="7" rx="1.5" />}{active ? <rect x="3" y="14" width="7" height="7" rx="1.5" fill="currentColor" stroke="none" /> : <rect x="3" y="14" width="7" height="7" rx="1.5" />}
    </svg>
  );
}

export default DashboardIcon;
