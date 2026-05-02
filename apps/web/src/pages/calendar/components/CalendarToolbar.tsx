import { cn } from "@myapp/ui/lib/utils";
import { CalendarRange, ChevronLeft, ChevronRight, Grid3x3, User, Users } from "lucide-react";
import type { CalendarScope, CalendarView } from "../types";

interface Props {
  view: CalendarView;
  scope: CalendarScope;
  rangeLabel: string;
  onViewChange: (view: CalendarView) => void;
  onScopeChange: (scope: CalendarScope) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

export function CalendarToolbar({
  view,
  scope,
  rangeLabel,
  onViewChange,
  onScopeChange,
  onPrev,
  onNext,
  onToday,
}: Props) {
  return (
    <div className="flex flex-col gap-3 border-b border-border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrev}
          aria-label="Previous"
          className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:bg-muted"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onToday}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
        >
          Today
        </button>
        <button
          type="button"
          onClick={onNext}
          aria-label="Next"
          className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:bg-muted"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <h2 className="ml-2 text-base font-semibold text-foreground">{rangeLabel}</h2>
      </div>

      <div className="flex items-center gap-3">
        <SegmentedControl
          options={[
            { value: "mine", label: "Mine", icon: User },
            { value: "role", label: "My role", icon: Users },
          ]}
          value={scope}
          onChange={onScopeChange}
        />
        <SegmentedControl
          options={[
            { value: "month", label: "Month", icon: Grid3x3 },
            { value: "two-week", label: "2 weeks", icon: CalendarRange },
          ]}
          value={view}
          onChange={onViewChange}
        />
      </div>
    </div>
  );
}

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Array<{ value: T; label: string; icon: typeof User }>;
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex items-center rounded-md border border-border bg-background p-0.5">
      {options.map((opt) => {
        const Icon = opt.icon;
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors",
              active
                ? "bg-hanover-green text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
