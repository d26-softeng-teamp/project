import { CalendarDays, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useSession } from "@/auth/session-context";
import { trpc } from "@/lib/trpc";
import { CalendarToolbar } from "./components/CalendarToolbar";
import { DayPanel } from "./components/DayPanel";
import { MonthGrid } from "./components/MonthGrid";
import { TwoWeekGrid } from "./components/TwoWeekGrid";
import type { CalendarEvent, CalendarScope, CalendarView } from "./types";
import {
  addDays,
  addMonths,
  dayKey,
  endOfMonth,
  endOfWeek,
  formatMonthYear,
  formatRange,
  startOfMonth,
  startOfWeek,
} from "./utils";

function CalendarPage() {
  const { session } = useSession();
  const [view, setView] = useState<CalendarView>("month");
  const [scope, setScope] = useState<CalendarScope>("mine");
  const [anchor, setAnchor] = useState<Date>(() => new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const range = useMemo(() => {
    if (view === "month") {
      const start = startOfWeek(startOfMonth(anchor));
      const end = endOfWeek(endOfMonth(anchor));
      return { start, end };
    }
    const start = startOfWeek(anchor);
    const end = addDays(start, 13);
    return { start, end };
  }, [anchor, view]);

  const eventsQuery = trpc.notifications.calendarEvents.useQuery(
    { scope, start: range.start, end: range.end },
    { enabled: Boolean(session) },
  );

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of eventsQuery.data ?? []) {
      const key = dayKey(new Date(event.date));
      const existing = map.get(key);
      if (existing) existing.push(event);
      else map.set(key, [event]);
    }
    return map;
  }, [eventsQuery.data]);

  const selectedDayEvents = selectedDay ? (eventsByDay.get(dayKey(selectedDay)) ?? []) : [];

  const rangeLabel =
    view === "month" ? formatMonthYear(anchor) : formatRange(range.start, range.end);

  function handlePrev() {
    setAnchor((current) => (view === "month" ? addMonths(current, -1) : addDays(current, -14)));
  }
  function handleNext() {
    setAnchor((current) => (view === "month" ? addMonths(current, 1) : addDays(current, 14)));
  }
  function handleToday() {
    setAnchor(new Date());
  }

  function handleSelectEvent(event: CalendarEvent) {
    setSelectedDay(new Date(event.date));
  }

  return (
    <div className="flex h-[calc(100vh-2.75rem)] flex-col overflow-hidden bg-muted">
      {/* Page header */}
      <div className="shrink-0 border-b border-border bg-card px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-screen-2xl items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-hanover-green/10">
            <CalendarDays className="h-5 w-5 text-hanover-green" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold tracking-tight text-foreground">Calendar</h1>
            <p className="text-xs text-muted-foreground">
              Review dates and expirations for your content. Toggle scope to include role-assigned
              items.
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto flex min-h-0 w-full max-w-screen-2xl flex-1 flex-col overflow-hidden">
        <CalendarToolbar
          view={view}
          scope={scope}
          rangeLabel={rangeLabel}
          onViewChange={setView}
          onScopeChange={setScope}
          onPrev={handlePrev}
          onNext={handleNext}
          onToday={handleToday}
        />

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <div className="flex min-h-0 flex-1 flex-col">
            {eventsQuery.isLoading ? (
              <div className="flex flex-1 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-hanover-green" />
              </div>
            ) : eventsQuery.isError ? (
              <div className="flex flex-1 items-center justify-center px-6">
                <p className="text-sm text-destructive">
                  Could not load calendar events.{" "}
                  {eventsQuery.error instanceof Error ? eventsQuery.error.message : null}
                </p>
              </div>
            ) : view === "month" ? (
              <MonthGrid
                anchor={anchor}
                eventsByDay={eventsByDay}
                onSelectDay={setSelectedDay}
                onSelectEvent={handleSelectEvent}
              />
            ) : (
              <TwoWeekGrid
                anchor={anchor}
                eventsByDay={eventsByDay}
                onSelectDay={setSelectedDay}
                onSelectEvent={handleSelectEvent}
              />
            )}

            {/* Legend */}
            <div className="flex shrink-0 items-center gap-4 border-t border-border bg-card px-4 py-2 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-3 rounded-sm bg-hanover-green" />
                Mine
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-3 rounded-sm border border-hanover-green/40 bg-hanover-green/10" />
                Role
              </span>
              <span className="ml-auto flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2 w-2 rounded-full bg-destructive" />
                  Overdue
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2 w-2 rounded-full bg-[#EA580C]" />≤ 7d
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2 w-2 rounded-full bg-[#C9A84C]" />≤ 15d
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2 w-2 rounded-full bg-hanover-green" />
                  Later
                </span>
              </span>
            </div>
          </div>

          {selectedDay && (
            <DayPanel
              date={selectedDay}
              events={selectedDayEvents}
              onClose={() => setSelectedDay(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default CalendarPage;
