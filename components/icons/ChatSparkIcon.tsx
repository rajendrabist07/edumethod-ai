import React from "react";

interface IconProps {
  size?: number | string;
  className?: string;
}

export function ChatSparkIcon({ size = 24, className = "" }: IconProps) {
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
      {/* Speech bubble outline */}
      <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5c-1.4 0-2.8-.4-3.9-1.1L3 21l2.1-5.6c-.7-1.1-1.1-2.5-1.1-3.9a8.5 8.5 0 0 1 8.5-8.5c.3 0 .7 0 1 .1" />

      {/* AI Spark element inside the speech bubble */}
      <path
        d="M16 6l1 2.5L19.5 9.5 17 10.5 16 13l-1-2.5-2.5-1 2.5-1.5L16 6z"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}

export default ChatSparkIcon;
