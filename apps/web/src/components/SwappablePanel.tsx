import { LayoutGrid } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

export type SwappableOption = {
  key: string;
  label: string;
  render: () => ReactNode;
};

type Props = {
  storageKey: string;
  options: SwappableOption[];
  className?: string;
};

export function SwappablePanel({ storageKey, options, className }: Props) {
  const fallback = options[0]?.key ?? "";

  const [activeKey, setActiveKey] = useState<string>(() => {
    if (typeof window === "undefined") return fallback;
    const saved = window.localStorage.getItem(storageKey);
    return saved && options.some((o) => o.key === saved) ? saved : fallback;
  });

  useEffect(() => {
    window.localStorage.setItem(storageKey, activeKey);
  }, [storageKey, activeKey]);

  const active = options.find((o) => o.key === activeKey) ?? options[0];
  if (!active) return null;

  return (
    <div className={`rounded bg-card p-6 shadow-sm ${className ?? ""}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <LayoutGrid className="h-3.5 w-3.5" />
          <span>Switch view</span>
        </div>
        <div role="tablist" className="flex flex-wrap gap-1">
          {options.map((opt) => {
            const isActive = opt.key === active.key;
            return (
              <button
                key={opt.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveKey(opt.key)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  isActive
                    ? "bg-hanover-green text-white shadow-sm"
                    : "border border-border text-muted-foreground hover:border-hanover-green/40 hover:bg-hanover-green/5 hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
      {active.render()}
    </div>
  );
}
