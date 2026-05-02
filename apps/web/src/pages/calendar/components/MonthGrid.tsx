import { cn } from "@myapp/ui/lib/utils";
import type { CalendarEvent } from "../types";
import {
  addDays,
  dayKey,
  endOfMonth,
  endOfWeek,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  WEEKDAY_LABELS_SHORT,
} from "../utils";
import { EventPill } from "./EventPill";

interface Props {
  anchor: Date;
  eventsByDay: Map<string, CalendarEvent[]>;
  onSelectDay: (date: Date) => void;
  onSelectEvent: (event: CalendarEvent) => void;
}

const MAX_VISIBLE = 3;

export function MonthGrid({ anchor, eventsByDay, onSelectDay, onSelectEvent }: Props) {
  const start = startOfWeek(startOfMonth(anchor));
  const end = endOfWeek(endOfMonth(anchor));
  const days: Date[] = [];
  for (let d = start; d.getTime() <= end.getTime(); d = addDays(d, 1)) days.push(d);

  const today = new Date();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Weekday header */}
      <div className="grid shrink-0 grid-cols-7 border-b border-border bg-card text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {WEEKDAY_LABELS_SHORT.map((label) => (
          <div key={label} className="px-2 py-2">
            {label}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div
        className="grid min-h-0 flex-1 grid-cols-7 bg-border"
        style={{ gridAutoRows: "minmax(0, 1fr)", gap: "1px" }}
      >
        {days.map((day) => {
          const inMonth = isSameMonth(day, anchor);
          const isToday = isSameDay(day, today);
          const dayEvents = eventsByDay.get(dayKey(day)) ?? [];
          const visible = dayEvents.slice(0, MAX_VISIBLE);
          const overflow = dayEvents.length - visible.length;

          return (
            // biome-ignore lint/a11y/useSemanticElements: non-button click target with rich content
            <div
              key={dayKey(day)}
              role="button"
              tabIndex={0}
              onClick={() => onSelectDay(day)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectDay(day);
                }
              }}
              className={cn(
                "flex min-h-0 cursor-pointer flex-col gap-1 p-1.5 text-left transition-colors",
                inMonth ? "bg-card hover:bg-muted/40" : "bg-muted/20 hover:bg-muted/40",
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-semibold",
                    isToday
                      ? "bg-hanover-green text-white"
                      : inMonth
                        ? "text-foreground"
                        : "text-muted-foreground/60",
                  )}
                >
                  {day.getDate()}
                </span>
                {dayEvents.length > 0 && inMonth && (
                  <span className="text-[10px] font-medium text-muted-foreground">
                    {dayEvents.length}
                  </span>
                )}
              </div>
              <div className="flex min-h-0 flex-col gap-0.5 overflow-hidden">
                {visible.map((event) => (
                  <EventPill key={event.id} event={event} onClick={onSelectEvent} />
                ))}
                {overflow > 0 && (
                  <span className="text-[10px] font-medium text-muted-foreground">
                    +{overflow} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
