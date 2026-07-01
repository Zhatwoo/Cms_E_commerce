"use client";

import React, { createContext, useCallback, useContext, useState } from "react";

type TransformModeContextValue = {
  transformModeNodeId: string | null;
  setTransformModeNodeId: (id: string | null) => void;
  isTransformMode: (nodeId: string) => boolean;
};

const TransformModeContext = createContext<TransformModeContextValue | null>(null);

export function TransformModeProvider({ children }: { children: React.ReactNode }) {
  const [transformModeNodeId, setTransformModeNodeId] = useState<string | null>(null);
  const isTransformMode = useCallback(
    (nodeId: string) => transformModeNodeId === nodeId,
    [transformModeNodeId]
  );
  return (
    <TransformModeContext.Provider
      value={{ transformModeNodeId, setTransformModeNodeId, isTransformMode }}
    >
      {children}
    </TransformModeContext.Provider>
  );
}

export function useTransformMode() {
  const ctx = useContext(TransformModeContext);
  if (!ctx) {
    return {
      transformModeNodeId: null as string | null,
      setTransformModeNodeId: (_: string | null) => {},
      isTransformMode: (_: string) => false,
    };
  }
  return ctx;
}
