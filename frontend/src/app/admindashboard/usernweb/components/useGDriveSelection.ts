import { useState, useCallback, useRef } from 'react';

interface SelectionState {
  selectedIds: Set<string>;
  lastSelectedId: string | null;
  isDragging: boolean;
}

export function useGDriveSelection() {
  const [state, setState] = useState<SelectionState>({
    selectedIds: new Set(),
    lastSelectedId: null,
    isDragging: false,
  });
  
  const dragStartIdRef = useRef<string | null>(null);

  const handleRowClick = useCallback((id: string, shiftKey: boolean, ctrlKey: boolean, items: string[]) => {
    setState((prev) => {
      const next = new Set(prev.selectedIds);

      if (shiftKey && prev.lastSelectedId) {
        // Shift+click: select range
        const startIdx = items.indexOf(prev.lastSelectedId);
        const endIdx = items.indexOf(id);
        
        if (startIdx !== -1 && endIdx !== -1) {
          const [start, end] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
          for (let i = start; i <= end; i++) {
            next.add(items[i]);
          }
        }
      } else if (ctrlKey) {
        // Ctrl/Cmd+click: toggle item in current selection
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
      } else {
        // Regular click: select only this row
        next.clear();
        next.add(id);
      }

      return {
        ...prev,
        selectedIds: next,
        lastSelectedId: id,
      };
    });
  }, []);

  const handleRowMouseDown = useCallback((id: string) => {
    dragStartIdRef.current = id;
    setState((prev) => ({ ...prev, isDragging: true }));
  }, []);

  const handleRowMouseEnter = useCallback((id: string, allItems: string[]) => {
    if (dragStartIdRef.current && state.isDragging) {
      // Prevent text selection during drag
      if (typeof window !== 'undefined') {
        const selection = window.getSelection?.();
        if (selection?.removeAllRanges) {
          selection.removeAllRanges();
        }
      }
      
      const startIdx = allItems.indexOf(dragStartIdRef.current!);
      const currentIdx = allItems.indexOf(id);
      
      if (startIdx !== -1 && currentIdx !== -1) {
        const [start, end] = startIdx < currentIdx ? [startIdx, currentIdx] : [currentIdx, startIdx];
        const rangeIds = new Set<string>();
        for (let i = start; i <= end; i++) {
          rangeIds.add(allItems[i]);
        }
        setState((prev) => ({
          ...prev,
          selectedIds: rangeIds,
        }));
      }
    }
  }, [state.isDragging]);

  const handleRowMouseUp = useCallback(() => {
    setState((prev) => ({ ...prev, isDragging: false }));
    dragStartIdRef.current = null;
  }, []);

  const clearSelection = useCallback(() => {
    setState({
      selectedIds: new Set(),
      lastSelectedId: null,
      isDragging: false,
    });
    dragStartIdRef.current = null;
  }, []);

  const selectAll = useCallback((ids: string[]) => {
    setState((prev) => ({
      ...prev,
      selectedIds: new Set(ids),
      lastSelectedId: ids[ids.length - 1] || null,
    }));
  }, []);

  return {
    selectedIds: state.selectedIds,
    lastSelectedId: state.lastSelectedId,
    isDragging: state.isDragging,
    handleRowClick,
    handleRowMouseDown,
    handleRowMouseEnter,
    handleRowMouseUp,
    clearSelection,
    selectAll,
  };
}
