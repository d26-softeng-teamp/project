import { GripVertical } from "lucide-react";
import { type ReactNode, useState } from "react";

export type SwappableItem = {
  id: string;
  node: ReactNode;
};

type Props = {
  items: SwappableItem[];
  order: string[];
  onSwap: (a: string, b: string) => void;
  className?: string;
};

/**
 * Renders `items` in the sequence dictated by `order`. Each item is a draggable
 * card; dropping one onto another swaps their positions (the rest of the layout
 * is unchanged — items don't shift, they trade places).
 */
export function SwappableLayout({ items, order, onSwap, className }: Props) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const byId = new Map(items.map((item) => [item.id, item]));
  const known = order.filter((id) => byId.has(id));
  const missing = items.filter((item) => !known.includes(item.id)).map((item) => item.id);
  const sequence = [...known, ...missing];

  return (
    <div className={className}>
      {sequence.map((id) => {
        const item = byId.get(id);
        if (!item) return null;
        const isDragging = draggingId === id;
        const isOver = dragOverId === id && draggingId !== null && draggingId !== id;

        return (
          // biome-ignore lint/a11y/useSemanticElements: draggable container, not a button
          <div
            key={id}
            role="button"
            tabIndex={0}
            draggable
            onDragStart={(e) => {
              setDraggingId(id);
              e.dataTransfer.effectAllowed = "move";
              e.dataTransfer.setData("text/plain", id);
            }}
            onDragEnd={() => {
              setDraggingId(null);
              setDragOverId(null);
            }}
            onDragOver={(e) => {
              if (draggingId && draggingId !== id) {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                if (dragOverId !== id) setDragOverId(id);
              }
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                if (dragOverId === id) setDragOverId(null);
              }
            }}
            onDrop={(e) => {
              e.preventDefault();
              const sourceId = e.dataTransfer.getData("text/plain") || draggingId;
              if (sourceId && sourceId !== id) {
                onSwap(sourceId, id);
              }
              setDraggingId(null);
              setDragOverId(null);
            }}
            className={`group/swap relative transition-all duration-150 ${
              isDragging ? "opacity-40 scale-[0.99]" : ""
            } ${
              isOver ? "ring-2 ring-hanover-green ring-offset-2 ring-offset-muted rounded-lg" : ""
            }`}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute right-3 top-3 z-20 flex h-6 w-6 items-center justify-center rounded-md bg-muted/80 text-muted-foreground opacity-0 shadow-sm transition-opacity duration-150 group-hover/swap:opacity-100"
              title="Drag to swap"
            >
              <GripVertical className="h-3.5 w-3.5" />
            </div>
            <div className="h-full cursor-grab active:cursor-grabbing">{item.node}</div>
          </div>
        );
      })}
    </div>
  );
}
