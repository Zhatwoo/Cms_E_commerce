import { useState, useCallback } from 'react';

export function useGDriveSelection() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartId, setDragStartId] = useState<string | null>(null);

  const handleRowClick = useCallback(
    (id: string, isShiftKey: boolean, isCtrlKey: boolean, allIds: string[]) => {
      if (isShiftKey && lastSelectedId) {
        // Shift-click: select range from lastSelectedId to id
        const startIndex = allIds.indexOf(lastSelectedId);
        const endIndex = allIds.indexOf(id);
        if (startIndex !== -1 && endIndex !== -1) {
          const [min, max] = [Math.min(startIndex, endIndex), Math.max(startIndex, endIndex)];
          const rangeIds = allIds.slice(min, max + 1);
          setSelectedIds((prev) => new Set([...prev, ...rangeIds]));
          setLastSelectedId(id);
        }
      } else if (isCtrlKey) {
        // Ctrl+click: toggle individual selection
        setSelectedIds((prev) => {
          const newSet = new Set(prev);
          if (newSet.has(id)) {
            newSet.delete(id);
          } else {
            newSet.add(id);
          }
          return newSet;
        });
        setLastSelectedId(id);
      } else {
        // Regular click: select only this item
        setSelectedIds(new Set([id]));
        setLastSelectedId(id);
      }
    },
    [lastSelectedId]
  );

  const handleRowMouseDown = useCallback((id: string) => {
    setIsDragging(true);
    setDragStartId(id);
  }, []);

  const handleRowMouseEnter = useCallback(
    (id: string, allIds: string[]) => {
      if (!isDragging || !dragStartId) return;

      const startIndex = allIds.indexOf(dragStartId);
      const endIndex = allIds.indexOf(id);
      if (startIndex !== -1 && endIndex !== -1) {
        const [min, max] = [Math.min(startIndex, endIndex), Math.max(startIndex, endIndex)];
        const rangeIds = allIds.slice(min, max + 1);
        setSelectedIds(new Set(rangeIds));
      }
    },
    [isDragging, dragStartId]
  );

  const handleRowMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragStartId(null);
  }, []);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const selectAll = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids));
    if (ids.length > 0) {
      setLastSelectedId(ids[ids.length - 1]);
    }
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setLastSelectedId(null);
  }, []);

  return {
    selectedIds,
    lastSelectedId,
    isDragging,
    handleRowClick,
    handleRowMouseDown,
    handleRowMouseEnter,
    handleRowMouseUp,
    toggleSelection,
    selectAll,
    clearSelection,
  };
}
