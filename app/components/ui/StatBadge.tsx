import React from "react";

interface StatBadgeProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "accent";
  className?: string;
}

export function StatBadge({ label, value, icon, variant = "default", className = "" }: StatBadgeProps) {
  const variants = {
    default: "bg-prism-surface border-prism-border text-prism-text",
    success: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
    warning: "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400",
    danger: "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400",
    accent: "bg-prism-accent/10 border-prism-accent/20 text-prism-accent",
  };

  return (
    <div className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium backdrop-blur-md ${variants[variant]} ${className}`}>
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="opacity-80">{label}</span>
      {value ? <strong className="font-mono font-bold tracking-tight">{value}</strong> : null}
    </div>
  );
}
