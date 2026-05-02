import { cn } from "@myapp/ui/lib/utils";
import { Clock3, FileX2, X } from "lucide-react";
import { Link } from "react-router";
import type { CalendarEvent } from "../types";
import { formatLongDate } from "../utils";

interface Props {
  date: Date | null;
  events: CalendarEvent[];
  onClose: () => void;
}

const URGENCY_DOT: Record<CalendarEvent["urgency"], string> = {
  critical: "bg-destructive",
  high: "bg-[#EA580C]",
  warning: "bg-[#C9A84C]",
  info: "bg-hanover-green",
};

export function DayPanel({ date, events, onClose }: Props) {
  if (!date) return null;

  return (
    <div className="flex min-h-0 w-full flex-col border-l border-border bg-card lg:w-96">
      <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {events.length === 0
              ? "No events"
              : events.length === 1
                ? "1 event"
                : `${events.length} events`}
          </p>
          <h3 className="text-sm font-semibold text-foreground">{formatLongDate(date)}</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex h-7 w-7 items-center justify-center rounded hover:bg-muted"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {events.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">Nothing scheduled for this day.</p>
        ) : (
          <ul className="divide-y divide-border">
            {events.map((event) => {
              const Icon = event.kind === "review" ? Clock3 : FileX2;
              return (
                <li key={event.id}>
                  <Link
                    to={`/hero/content/${event.fileID}/edit`}
                    className="flex items-start gap-3 px-4 py-3 text-sm transition-colors hover:bg-muted/50"
                  >
                    <span
                      className={cn(
                        "mt-1 inline-flex h-2 w-2 shrink-0 rounded-full",
                        URGENCY_DOT[event.urgency],
                      )}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        <Icon className="h-3 w-3" />
                        {event.kind === "review" ? "Review due" : "Expires"}
                        {event.ownership === "role" && (
                          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] normal-case tracking-normal text-muted-foreground">
                            Role
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 truncate font-medium text-foreground">
                        {event.fileName}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
