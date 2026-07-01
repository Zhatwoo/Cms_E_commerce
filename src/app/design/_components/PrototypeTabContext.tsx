"use client";

import React, { createContext, useContext } from "react";

const PrototypeTabContext = createContext<boolean>(false);

export function PrototypeTabProvider({
  isActive,
  children,
}: {
  isActive: boolean;
  children: React.ReactNode;
}) {
  return (
    <PrototypeTabContext.Provider value={isActive}>
      {children}
    </PrototypeTabContext.Provider>
  );
}

export function usePrototypeTabActive(): boolean {
  return useContext(PrototypeTabContext);
}
