"use client";

import React, { createContext, useContext, useState } from "react";

type InlineTextEditContextValue = {
  editingTextNodeId: string | null;
  setEditingTextNodeId: (id: string | null) => void;
};

const InlineTextEditContext = createContext<InlineTextEditContextValue | null>(null);

export function InlineTextEditProvider({ children }: { children: React.ReactNode }) {
  const [editingTextNodeId, setEditingTextNodeId] = useState<string | null>(null);
  return (
    <InlineTextEditContext.Provider value={{ editingTextNodeId, setEditingTextNodeId }}>
      {children}
    </InlineTextEditContext.Provider>
  );
}

export function useInlineTextEdit() {
  const ctx = useContext(InlineTextEditContext);
  return ctx ?? { editingTextNodeId: null as string | null, setEditingTextNodeId: (_: string | null) => {} };
}
