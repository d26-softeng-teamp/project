import { cn } from "@myapp/ui/lib/utils";
import type { CalendarEvent } from "../types";
import { addDays, dayKey, isSameDay, startOfWeek, WEEKDAY_LABELS_SHORT } from "../utils";
import { EventPill } from "./EventPill";

interface Props {
  anchor: Date;
  eventsByDay: Map<string, CalendarEvent[]>;
  onSelectDay: (date: Date) => void;
  onSelectEvent: (event: CalendarEvent) => void;
}

const MAX_VISIBLE = 6;

export function TwoWeekGrid({ anchor, eventsByDay, onSelectDay, onSelectEvent }: Props) {
  const start = startOfWeek(anchor);
  const days: Date[] = [];
  for (let i = 0; i < 14; i++) days.push(addDays(start, i));
  const today = new Date();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="grid shrink-0 grid-cols-7 border-b border-border bg-card text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {WEEKDAY_LABELS_SHORT.map((label) => (
          <div key={label} className="px-2 py-2">
            {label}
          </div>
        ))}
      </div>

      <div
        className="grid min-h-0 flex-1 grid-cols-7 bg-border"
        style={{ gridTemplateRows: "repeat(2, minmax(0, 1fr))", gap: "1px" }}
      >
        {days.map((day) => {
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
              className="flex min-h-0 cursor-pointer flex-col gap-1.5 bg-card p-2 text-left transition-colors hover:bg-muted/40"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-1.5">
                  <span
                    className={cn(
                      "inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-sm font-semibold",
                      isToday ? "bg-hanover-green text-white" : "text-foreground",
                    )}
                  >
                    {day.getDate()}
                  </span>
                  <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    {WEEKDAY_LABELS_SHORT[day.getDay()]}
                  </span>
                </div>
                {dayEvents.length > 0 && (
                  <span className="text-[10px] font-medium text-muted-foreground">
                    {dayEvents.length}
                  </span>
                )}
              </div>
              <div className="flex min-h-0 flex-col gap-1 overflow-hidden">
                {visible.map((event) => (
                  <EventPill
                    key={event.id}
                    event={event}
                    variant="detail"
                    onClick={onSelectEvent}
                  />
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
