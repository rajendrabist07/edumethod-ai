"use client";

import React, { useEffect, useRef } from "react";
import { useLayout } from "./LayoutContext";
import { SidebarAside } from "./SidebarAside";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/Logo";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { collapsed, setCollapsed, mobileOpen, setMobileOpen } = useLayout();
  const pathname = usePathname();
  const drawerRef = useRef<HTMLDivElement>(null);
  const mobileToggleRef = useRef<HTMLButtonElement>(null);

  // Auto-close mobile drawer on pathname transitions
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, setMobileOpen]);

  // Accessibility: Close drawer/popups on Escape keydown
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setMobileOpen]);

  // Accessibility: Focus trap & focus restore for Mobile Drawer
  useEffect(() => {
    if (mobileOpen && drawerRef.current) {
      // Find all focusable elements inside the drawer
      const focusables = drawerRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex="0"]'
      );
      if (focusables.length > 0) {
        const first = focusables[0] as HTMLElement;
        const last = focusables[focusables.length - 1] as HTMLElement;

        first.focus();

        const handleTabKey = (e: KeyboardEvent) => {
          if (e.key === "Tab") {
            if (e.shiftKey) {
              if (document.activeElement === first) {
                last.focus();
                e.preventDefault();
              }
            } else {
              if (document.activeElement === last) {
                first.focus();
                e.preventDefault();
              }
            }
          }
        };

        window.addEventListener("keydown", handleTabKey);
        return () => window.removeEventListener("keydown", handleTabKey);
      }
    } else {
      // Restore focus to mobile toggle button when drawer closes
      mobileToggleRef.current?.focus();
    }
  }, [mobileOpen]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-prism-base text-prism-text font-sans relative select-none">
      
      {/* Premium floating radial ambient glow (iOS 27 style concept visual depth) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 select-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-prism-accent/8 dark:bg-prism-accent/5 filter blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-prism-warm/6 dark:bg-prism-warm/4 filter blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-pulse-slow-delay" />
      </div>
      
      {/* ========================================================================= */}
      {/* 1. MOBILE OVERLAY DRAWER (< 1024px)                                       */}
      {/* ========================================================================= */}
      {/* Mobile Backdrop */}
      <div
        onClick={() => setMobileOpen(false)}
        className={`fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-40 transition-opacity duration-300 lg:hidden ${
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        role="presentation"
      />

      {/* Mobile Off-Canvas Sidebar Container */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Sidebar navigation drawer"
        className={`fixed inset-y-0 left-0 z-45 transition-transform duration-300 ease-out transform lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarAside />
        {/* Mobile close button floating next to drawer */}
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-[-50px] p-2.5 rounded-xl bg-slate-900/90 text-white hover:bg-slate-800 transition active:scale-90"
          aria-label="Close menu drawer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2.5"
            stroke="currentColor"
            className="w-4 h-4"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 2. DESKTOP RAIL SYSTEM (>= 1024px)                                        */}
      {/* ========================================================================= */}
      <aside
        style={{ width: collapsed ? "0px" : "260px" }}
        className="hidden lg:block shrink-0 h-full overflow-hidden transition-[width] duration-300 ease-in-out z-10"
      >
        {/* Fixed inner wrapper prevents width resizing from squishing text labels */}
        <div className="w-[260px] h-full">
          <SidebarAside />
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 3. MAIN WORKSPACE VIEWPORT                                                */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        
        {/* Sticky Header for Mobile / Tablet Viewports */}
        <header className="flex lg:hidden shrink-0 items-center justify-between px-4 py-3 bg-[color:var(--surface)] border-b border-[color:var(--border)] shadow-xs z-10">
          <div className="flex items-center gap-3">
            <button
              ref={mobileToggleRef}
              onClick={() => setMobileOpen(true)}
              aria-expanded={mobileOpen}
              className="p-2 rounded-xl border border-[color:var(--border)] hover:bg-[color:var(--surface-soft)] text-[color:var(--text)] transition active:scale-95 cursor-pointer"
              aria-label="Open Workspace Navigation Drawer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2.5"
                stroke="currentColor"
                className="w-4.5 h-4.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <Logo size={22} />
              <span className="text-[11px] font-black uppercase tracking-wider text-[color:var(--sidebar-accent)]">
                EduMethod AI
              </span>
            </div>
          </div>
        </header>

        {/* Floating Desktop Expand Button (Claude / ChatGPT style panel expander) */}
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="hidden lg:flex fixed top-4 left-4 z-30 p-2.5 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)]/90 backdrop-blur-xs text-[color:var(--text)] shadow-sm hover:border-[color:var(--sidebar-accent)]/40 hover:bg-[color:var(--surface-soft)] active:scale-95 transition cursor-pointer"
            title="Expand Sidebar (Ctrl + \)"
            aria-label="Expand Workspace Sidebar"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2.5"
              stroke="currentColor"
              className="w-4 h-4 text-[color:var(--text)]"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        )}

        {/* Scrollable Children Page Slot */}
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
export default AppLayout;
