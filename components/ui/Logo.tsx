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
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none ${className}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="prism-cool" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
        <linearGradient id="prism-warm" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ec4899" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>

      <g transform="scale(0.96) translate(10, 10)">
        {/* Spine */}
        <polygon points="96,96 176,96 176,416 96,416" fill={coolFill} />
        
        {/* Top Beam */}
        <polygon points="176,96 416,96 336,176 176,176" fill={warmFill} opacity={colored ? 1 : 0.8} />
        {colored && <polygon points="176,96 336,176 176,176" fill="white" opacity="0.2" />}
        
        {/* Middle Beam */}
        <polygon points="176,216 356,216 276,296 176,296" fill={coolFill} opacity={colored ? 1 : 0.6} />
        {colored && <polygon points="176,216 276,296 176,296" fill="white" opacity="0.25" />}
        
        {/* Bottom Beam */}
        <polygon points="176,336 416,336 336,416 176,416" fill={warmFill} opacity={colored ? 1 : 0.8} />
        {colored && <polygon points="176,336 336,416 176,416" fill="white" opacity="0.2" />}
      </g>
    </svg>
  );
}

export default Logo;
