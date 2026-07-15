import React from "react";

interface IconProps {
  size?: number | string;
  className?: string;
}

export function DocumentPasteIcon({ size = 24, className = "" }: IconProps) {
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
      {/* Background document layout (representing source copy text) */}
      <path d="M14 2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2" opacity="0.4" />

      {/* Foreground clipboard document (representing target paste) */}
      <path d="M20 9v11a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h6l4 4z" />
      <path d="M16 7v3h3" />
      
      {/* Document text outlines */}
      <path d="M11 14h5" />
      <path d="M11 18h3" />
    </svg>
  );
}

export default DocumentPasteIcon;
