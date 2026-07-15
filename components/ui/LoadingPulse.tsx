import React from "react";
import { Logo } from "./Logo";

interface LoadingPulseProps {
  message?: string;
  className?: string;
}

export function LoadingPulse({ message = "AI processing in progress...", className = "" }: LoadingPulseProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`.trim()}>
      <div className="relative flex items-center justify-center w-20 h-20 mb-5">
        {/* Outer glowing pulsing aura */}
        <div className="absolute inset-0 rounded-full bg-blue-500/10 blur-xl animate-pulse" />
        
        {/* Secondary rotating gradient ring */}
        <div className="absolute -inset-1 rounded-full border border-dashed border-purple-500/30 animate-[spin_10s_linear_infinite]" />
        
        {/* Center Logo pulsing */}
        <Logo size={42} className="relative z-10 animate-pulse animate-duration-1000" />
      </div>
      
      {/* Loading Message */}
      <p className="text-xs font-bold uppercase tracking-[0.2em] bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400 animate-pulse">
        {message}
      </p>
      <p className="text-4xs font-semibold text-[color:var(--muted)] tracking-wider mt-1.5 uppercase">
        EduMethod Cognitive Network
      </p>
    </div>
  );
}

export default LoadingPulse;
