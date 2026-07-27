import React from "react";

interface LogoProps {
  size?: number | string;
  className?: string;
  colored?: boolean;
}

export function Logo({ size = 32, className = "", colored = true }: LogoProps) {
  const coolFill = colored ? "url(#prism-cool)" : "currentColor";
  const warmFill = colored ? "url(#prism-warm)" : "currentColor";

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
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none ${className}`}
      aria-hidden="true"
    >
      <path d="M4 18L12 20L12 9L4 7Z" fill={colored ? coolFill : "none"} stroke={colored ? "none" : "currentColor"} opacity={colored ? 0.9 : 1} />
      <path d="M20 18L12 20L12 9L20 7Z" fill={colored ? warmFill : "none"} stroke={colored ? "none" : "currentColor"} opacity={colored ? 0.9 : 1} />
      {/* If colored, draw the outline over the fills for crispness */}
      {colored && (
        <>
          <path d="M4 18L12 20L12 9L4 7Z" />
          <path d="M20 18L12 20L12 9L20 7Z" />
        </>
      )}
      <path d="M12 16L12 2" strokeWidth="2" />
      <path d="M8 6L12 2L16 6" strokeWidth="2" />
    </svg>
  );
}

export default Logo;
