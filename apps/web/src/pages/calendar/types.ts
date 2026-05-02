import type { RouterOutputs } from "@/lib/trpc";

export type CalendarEvent = RouterOutputs["notifications"]["calendarEvents"][number];

export type CalendarView = "month" | "two-week";
export type CalendarScope = "mine" | "role";
