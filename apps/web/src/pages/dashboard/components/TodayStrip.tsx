import { cn } from "@myapp/ui/lib/utils";
import { AlertCircle, CalendarClock, Clock, type LucideIcon, Megaphone } from "lucide-react";
import { Link } from "react-router";

interface TodayItem {
  key: string;
  count: number;
  label: string;
  to: string;
  icon: LucideIcon;
  tone: "critical" | "warn" | "info";
}

interface Props {
  overdueReviews: number;
  expiredDocs: number;
  staleCheckouts: number;
  unreadAnnouncements: number;
}

const TONE_CLASS: Record<TodayItem["tone"], string> = {
  critical: "border-destructive/40 bg-destructive/5 text-destructive hover:bg-destructive/10",
  warn: "border-[#EA580C]/40 bg-[#EA580C]/5 text-[#EA580C] hover:bg-[#EA580C]/10",
  info: "border-hanover-green/40 bg-hanover-green/5 text-hanover-green hover:bg-hanover-green/10",
};

export function TodayStrip({
  overdueReviews,
  expiredDocs,
  staleCheckouts,
  unreadAnnouncements,
}: Props) {
  const items: TodayItem[] = (
    [
      {
        key: "overdue",
        count: overdueReviews,
        label: overdueReviews === 1 ? "review overdue" : "reviews overdue",
        to: "/calendar",
        icon: AlertCircle,
        tone: "critical",
      },
      {
        key: "expired",
        count: expiredDocs,
        label: expiredDocs === 1 ? "document expired" : "documents expired",
        to: "/calendar",
        icon: CalendarClock,
        tone: "critical",
      },
      {
        key: "stale-checkouts",
        count: staleCheckouts,
        label: staleCheckouts === 1 ? "stale checkout" : "stale checkouts",
        to: "/hero/content",
        icon: Clock,
        tone: "warn",
      },
      {
        key: "announcements",
        count: unreadAnnouncements,
        label: unreadAnnouncements === 1 ? "new announcement" : "new announcements",
        to: "/announcements",
        icon: Megaphone,
        tone: "info",
      },
    ] satisfies TodayItem[]
  ).filter((item) => item.count > 0);

  if (items.length === 0) return null;

  return (
    <section
      aria-label="Today"
      className="mb-6 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 shadow-sm"
    >
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Today
      </span>
      <div className="flex flex-wrap items-center gap-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.key}
              to={item.to}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                TONE_CLASS[item.tone],
              )}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="font-semibold tabular-nums">{item.count}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
