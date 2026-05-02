import { cn } from "@myapp/ui/lib/utils";
import { Megaphone, TriangleAlert } from "lucide-react";
import type { RouterOutputs } from "@/lib/trpc";

export type AnnouncementItem =
  RouterOutputs["notifications"]["listAnnouncements"]["active"][number];

interface Props {
  item: AnnouncementItem;
  onMarkRead?: (id: string) => void;
}

const URGENCY_BADGE: Record<AnnouncementItem["urgency"], { className: string; label: string }> = {
  critical: { className: "bg-destructive/10 text-destructive", label: "Urgent" },
  high: { className: "bg-[#EA580C]/10 text-[#EA580C]", label: "Important" },
  warning: { className: "bg-[#C9A84C]/10 text-[#C9A84C]", label: "Heads up" },
  info: { className: "bg-hanover-green/10 text-hanover-green", label: "Info" },
};

const URGENCY_BORDER: Record<AnnouncementItem["urgency"], string> = {
  critical: "border-l-destructive",
  high: "border-l-[#EA580C]",
  warning: "border-l-[#C9A84C]",
  info: "border-l-hanover-green/60",
};

function formatDate(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function AnnouncementCard({ item, onMarkRead }: Props) {
  const urgency = URGENCY_BADGE[item.urgency];

  return (
    <article
      className={cn(
        "flex flex-col gap-3 rounded-lg border border-border border-l-4 bg-card p-4 shadow-sm transition-shadow hover:shadow-md",
        URGENCY_BORDER[item.urgency],
        !item.isRead && "ring-1 ring-hanover-green/20",
      )}
    >
      <header className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Megaphone className="h-4 w-4 text-muted-foreground" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold leading-snug text-foreground">{item.title}</h3>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                urgency.className,
              )}
            >
              {item.urgency === "critical" && <TriangleAlert className="h-2.5 w-2.5" />}
              {urgency.label}
            </span>
            {!item.isRead && (
              <span className="inline-flex items-center gap-1 rounded-full bg-hanover-green/10 px-2 py-0.5 text-[10px] font-semibold text-hanover-green">
                New
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {item.authorName ?? "Unknown author"} · {formatDate(item.publishedAt)}
            {item.audience === "roles" && item.targetRoles.length > 0 && (
              <span> · {item.targetRoles.join(", ")}</span>
            )}
          </p>
        </div>
      </header>

      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{item.body}</p>

      {!item.isRead && onMarkRead && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => onMarkRead(item.id)}
            className="rounded-md border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Mark as read
          </button>
        </div>
      )}
    </article>
  );
}
