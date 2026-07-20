"use client";

import React, { createContext, useContext, useState } from "react";

interface LayoutContextType {
  collapsed: boolean;
  mobileOpen: boolean;
  setCollapsed: (collapsed: boolean) => void;
  setMobileOpen: (open: boolean) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({
  children,
  initialCollapsed = false,
}: {
  children: React.ReactNode;
  initialCollapsed?: boolean;
}) {
  const [collapsed, setCollapsedState] = useState(initialCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);

  const setCollapsed = (val: boolean) => {
    setCollapsedState(val);
    document.cookie = `sidebar-collapsed=${val}; path=/; max-age=31536000; SameSite=Lax`;
  };

  return (
    <LayoutContext.Provider value={{ collapsed, mobileOpen, setCollapsed, setMobileOpen }}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error("useLayout must be used within a LayoutProvider");
  }
  return context;
}
