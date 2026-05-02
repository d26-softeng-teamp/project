import { useCallback, useState } from "react";

export function useNotificationSelection(ids: string[]) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [lastSelected, setLastSelected] = useState<string | null>(null);

  const toggle = useCallback(
    (id: string, shiftKey = false) => {
      setSelected((prev) => {
        const next = new Set(prev);
        if (shiftKey && lastSelected) {
          const fromIdx = ids.indexOf(lastSelected);
          const toIdx = ids.indexOf(id);
          if (fromIdx !== -1 && toIdx !== -1) {
            const [start, end] = fromIdx < toIdx ? [fromIdx, toIdx] : [toIdx, fromIdx];
            for (let i = start; i <= end; i++) {
              next.add(ids[i]);
            }
            return next;
          }
        }
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
      setLastSelected(id);
    },
    [ids, lastSelected],
  );

  const selectAll = useCallback(() => {
    setSelected(new Set(ids));
  }, [ids]);

  const clearAll = useCallback(() => {
    setSelected(new Set());
  }, []);

  const isSelected = useCallback((id: string) => selected.has(id), [selected]);

  return {
    selected,
    toggle,
    selectAll,
    clearAll,
    isSelected,
    count: selected.size,
    hasSelection: selected.size > 0,
  };
}
