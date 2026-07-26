import React from "react";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hoverEffect?: boolean;
}

export function GlassCard({ children, className = "", hoverEffect = false, ...props }: GlassCardProps) {
  return (
    <div
      className={`glass-card ${hoverEffect ? "glass-card-hover" : ""} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
