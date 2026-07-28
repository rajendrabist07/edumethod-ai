import React from "react";
import Link from "next/link";

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "accent";
  href?: string;
  className?: string;
}

export function GlassButton({
  children,
  variant = "secondary",
  href,
  className = "",
  ...props
}: GlassButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-prism-accent focus-visible:ring-offset-2";
    
  const variants = {
    primary: "bg-prism-accent text-white shadow-lg shadow-prism-accent/15 hover:bg-[color:var(--accent-strong)] hover:-translate-y-[1px]",
    secondary: "border border-prism-border bg-prism-surface/70 text-prism-text backdrop-blur-sm hover:border-prism-accent/50 hover:bg-prism-surface hover:text-prism-accent",
    accent: "bg-[color:var(--scholar-leaf)] text-white shadow-md hover:bg-prism-accent hover:shadow-lg",
  };

  const combinedClassName = `${baseStyles} ${variants[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={combinedClassName}>
        {children}
      </Link>
    );
  }

  return (
    <button className={combinedClassName} {...props}>
      {children}
    </button>
  );
}
