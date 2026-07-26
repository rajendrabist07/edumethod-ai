import React from "react";
import { PrismIconProps } from "./types";

export function ExportIcon({ size = 24, className = "", active = false, ...props }: PrismIconProps) {
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
      <circle cx="18" cy="5" r="3" fill={active ? "currentColor" : "none"} stroke={active ? "none" : "currentColor"} /><circle cx="6" cy="12" r="3" fill={active ? "currentColor" : "none"} stroke={active ? "none" : "currentColor"} /><circle cx="18" cy="19" r="3" fill={active ? "currentColor" : "none"} stroke={active ? "none" : "currentColor"} /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

export default ExportIcon;
