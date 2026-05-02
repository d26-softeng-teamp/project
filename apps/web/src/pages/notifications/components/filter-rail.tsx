import { cn } from "@myapp/ui/lib/utils";
import { Bell, Bookmark, FilePenLine, UserRoundCog } from "lucide-react";
import type { FilterKey } from "../types";

interface FilterRailProps {
  activeFilter: FilterKey;
  onFilter: (key: FilterKey) => void;
  counts: Record<FilterKey, number>;
}

const FILTERS: { key: FilterKey; label: string; icon: React.ReactNode }[] = [
  { key: "all", label: "All", icon: <Bell className="h-4 w-4" /> },
  { key: "unread", label: "Unread", icon: <Bell className="h-4 w-4" /> },
  { key: "pinned", label: "Pinned", icon: <Bookmark className="h-4 w-4" /> },
  { key: "changes", label: "Changes", icon: <FilePenLine className="h-4 w-4" /> },
  { key: "ownership", label: "Ownership", icon: <UserRoundCog className="h-4 w-4" /> },
];

export function FilterRail({ activeFilter, onFilter, counts }: FilterRailProps) {
  return (
    <aside className="flex w-full shrink-0 flex-col gap-1 border-b border-border bg-card pb-3 pt-3 lg:w-52 lg:overflow-y-auto lg:border-b-0 lg:border-r lg:pb-6 lg:pt-6">
      <p className="mb-2 hidden px-4 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground lg:block">
        Filter
      </p>

      {/* Mobile: horizontal scroll */}
      <div className="flex gap-1 overflow-x-auto px-3 lg:flex-col lg:overflow-visible lg:px-2">
        {FILTERS.map((f) => {
          const count = counts[f.key];
          const isActive = activeFilter === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => onFilter(f.key)}
              className={cn(
                "flex shrink-0 items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150",
                "lg:w-full",
                isActive
                  ? "bg-hanover-green/10 text-hanover-green"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <span
                className={cn(
                  "shrink-0 transition-colors",
                  isActive ? "text-hanover-green" : "text-muted-foreground",
                )}
              >
                {f.icon}
              </span>
              <span className="hidden lg:block">{f.label}</span>
              <span className="block lg:hidden">{f.label}</span>
              {count > 0 && (
                <span
                  className={cn(
                    "ml-auto hidden rounded-full px-1.5 py-0.5 text-xs font-semibold tabular-nums lg:block",
                    isActive
                      ? "bg-hanover-green/20 text-hanover-green"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
