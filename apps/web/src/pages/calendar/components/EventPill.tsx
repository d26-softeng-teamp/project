import { cn } from "@myapp/ui/lib/utils";
import { Clock3, FileX2 } from "lucide-react";
import type { CalendarEvent } from "../types";

interface Props {
  event: CalendarEvent;
  variant?: "compact" | "detail";
  onClick?: (event: CalendarEvent) => void;
}

const URGENCY_COLOR: Record<CalendarEvent["urgency"], { fill: string; outline: string }> = {
  critical: {
    fill: "bg-destructive text-white border-destructive",
    outline: "bg-destructive/10 text-destructive border-destructive/40",
  },
  high: {
    fill: "bg-[#EA580C] text-white border-[#EA580C]",
    outline: "bg-[#EA580C]/10 text-[#EA580C] border-[#EA580C]/40",
  },
  warning: {
    fill: "bg-[#C9A84C] text-white border-[#C9A84C]",
    outline: "bg-[#C9A84C]/10 text-[#C9A84C] border-[#C9A84C]/40",
  },
  info: {
    fill: "bg-hanover-green text-white border-hanover-green",
    outline: "bg-hanover-green/10 text-hanover-green border-hanover-green/40",
  },
};

export function EventPill({ event, variant = "compact", onClick }: Props) {
  const palette = URGENCY_COLOR[event.urgency];
  const colorClass = event.ownership === "mine" ? palette.fill : palette.outline;
  const Icon = event.kind === "review" ? Clock3 : FileX2;

  const base =
    variant === "compact"
      ? "flex items-center gap-1 truncate rounded-sm border px-1.5 py-0.5 text-[10px] font-medium leading-tight"
      : "flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium";

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(event);
      }}
      title={`${event.kind === "review" ? "Review due" : "Expires"}: ${event.fileName}`}
      className={cn(
        base,
        colorClass,
        "transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-hanover-green/40",
      )}
    >
      <Icon className={variant === "compact" ? "h-2.5 w-2.5 shrink-0" : "h-3 w-3 shrink-0"} />
      <span className="truncate">{event.fileName}</span>
    </button>
  );
}
