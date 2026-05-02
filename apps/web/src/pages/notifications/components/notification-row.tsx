import { cn } from "@myapp/ui/lib/utils";
import {
  Bell,
  Bookmark,
  BookmarkCheck,
  Clock3,
  FilePenLine,
  Megaphone,
  TriangleAlert,
  UserRoundCog,
} from "lucide-react";
import type { NotificationItem } from "../types";

interface NotificationRowProps {
  item: NotificationItem;
  isSelected: boolean;
  isActive: boolean;
  onSelect: (id: string, shiftKey: boolean) => void;
  onOpen: (item: NotificationItem) => void;
  onPin: (item: NotificationItem) => void;
}

function TypeIcon({ type }: { type: NotificationItem["type"] }) {
  switch (type) {
    case "document-change":
      return <FilePenLine className="h-3.5 w-3.5 shrink-0" />;
    case "expiration":
      return <Clock3 className="h-3.5 w-3.5 shrink-0" />;
    case "ownership-update":
      return <UserRoundCog className="h-3.5 w-3.5 shrink-0" />;
    case "announcement":
      return <Megaphone className="h-3.5 w-3.5 shrink-0" />;
    default:
      return <Bell className="h-3.5 w-3.5 shrink-0" />;
  }
}

function urgencyRailClass(urgency: NotificationItem["urgency"]) {
  switch (urgency) {
    case "critical":
      return "bg-destructive";
    case "high":
      return "bg-[#EA580C]"; // orange — last week
    case "warning":
      return "bg-[#C9A84C]"; // amber — expiring soon (≤15d)
    default:
      return "bg-hanover-green"; // info — chill
  }
}

function urgencyIconClass(urgency: NotificationItem["urgency"]) {
  switch (urgency) {
    case "critical":
      return "text-destructive";
    case "high":
      return "text-[#EA580C]";
    case "warning":
      return "text-[#C9A84C]";
    default:
      return "text-hanover-green";
  }
}

function typeLabel(type: NotificationItem["type"]) {
  switch (type) {
    case "document-change":
      return "Update";
    case "expiration":
      return "Review / Expiry";
    case "ownership-update":
      return "Ownership";
    case "announcement":
      return "Announcement";
    default:
      return "Notification";
  }
}

function formatDate(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(date);
  }
  if (diffDays < 7) {
    return new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date);
  }
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}

export function NotificationRow({
  item,
  isSelected,
  isActive,
  onSelect,
  onOpen,
  onPin,
}: NotificationRowProps) {
  // Critical/high/warning always show their urgency rail. Info-tier items
  // only show the rail when unread (so read items genuinely "settle").
  const showRail =
    item.urgency === "critical" ||
    item.urgency === "high" ||
    item.urgency === "warning" ||
    !item.isRead;

  // Read items recede: muted background, desaturated text, no dot.
  // Unread items "lit": full card background, foreground text, dot indicator.
  return (
    // biome-ignore lint/a11y/useSemanticElements: custom list item needs full layout control
    <div
      role="button"
      aria-label={item.fileName}
      aria-pressed={isActive}
      className={cn(
        "group relative flex cursor-pointer items-stretch border-b border-border transition-colors duration-150 last:border-b-0",
        // Background tint — strongest read/unread signal
        item.isRead ? "bg-muted/40" : "bg-card",
        // Hover
        !isActive && (item.isRead ? "hover:bg-muted/60" : "hover:bg-muted/30"),
        // Active (selected for preview)
        isActive && "bg-hanover-green/5",
        // Multi-select highlight overrides everything
        isSelected && "bg-hanover-green/10",
      )}
      onClick={() => onOpen(item)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(item);
        }
      }}
      tabIndex={0}
    >
      {/* Urgency / unread rail */}
      <div
        className={cn(
          "w-1 shrink-0 transition-colors duration-150",
          showRail
            ? cn(
                urgencyRailClass(item.urgency),
                item.isRead && "opacity-60", // critical/warning rails dim slightly when read
              )
            : "bg-transparent",
        )}
      />

      {/* Unread dot — peripheral-vision signal */}
      <div className="flex w-3 shrink-0 items-center justify-center" aria-hidden={item.isRead}>
        {!item.isRead && (
          <span
            role="presentation"
            title="Unread"
            className="h-1.5 w-1.5 rounded-full bg-hanover-green ring-2 ring-hanover-green/15"
          />
        )}
      </div>

      {/* Checkbox */}
      <label
        className="flex w-8 shrink-0 cursor-pointer items-center justify-center"
        aria-label={`Select notification: ${item.fileName}`}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <input
          type="checkbox"
          className="sr-only"
          checked={isSelected}
          onChange={(e) => {
            onSelect(item.id, e.nativeEvent instanceof MouseEvent && e.nativeEvent.shiftKey);
          }}
        />
        <div
          className={cn(
            "flex h-4 w-4 items-center justify-center rounded border transition-all duration-150",
            isSelected
              ? "border-hanover-green bg-hanover-green"
              : "border-border bg-background opacity-0 group-hover:opacity-100",
          )}
          aria-hidden="true"
        >
          {isSelected && (
            <svg viewBox="0 0 10 8" className="h-2.5 w-2.5" aria-hidden="true">
              <title>Selected</title>
              <path
                d="M1 4l3 3 5-6"
                stroke="white"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
      </label>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col py-3 pr-2">
        <div className="flex items-center gap-2">
          {/* Type icon + label — fade slightly when read */}
          <span
            className={cn(
              "inline-flex items-center gap-1 text-xs font-medium transition-opacity",
              urgencyIconClass(item.urgency),
              item.isRead && "opacity-60",
            )}
          >
            <TypeIcon type={item.type} />
            {typeLabel(item.type)}
          </span>

          {/* Urgency badges — keep full color even when read so urgency stays visible */}
          {item.urgency === "critical" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-1.5 py-0.5 text-[10px] font-semibold text-destructive">
              <TriangleAlert className="h-2.5 w-2.5" />
              Urgent
            </span>
          )}
          {item.urgency === "high" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#EA580C]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#EA580C]">
              This week
            </span>
          )}
          {item.urgency === "warning" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#C9A84C]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#C9A84C]">
              Soon
            </span>
          )}

          <span
            className={cn(
              "ml-auto shrink-0 text-xs",
              item.isRead ? "text-muted-foreground/70" : "text-muted-foreground",
            )}
          >
            {formatDate(item.createdAt)}
          </span>
        </div>

        {/* Filename / title — bold + foreground for unread, regular + muted for read */}
        <p
          className={cn(
            "mt-0.5 truncate text-sm leading-snug",
            item.isRead ? "font-normal text-muted-foreground" : "font-semibold text-foreground",
          )}
        >
          {item.fileName}
        </p>

        {/* Message preview — already muted; dim slightly more when read */}
        <p
          className={cn(
            "mt-0.5 truncate text-xs",
            item.isRead ? "text-muted-foreground/70" : "text-muted-foreground",
          )}
        >
          {item.actorName ? `${item.actorName} — ` : ""}
          {item.message}
        </p>
      </div>

      {/* Pin button */}
      <button
        type="button"
        aria-label={item.isPinned ? "Unpin" : "Pin"}
        className={cn(
          "flex w-8 shrink-0 items-center justify-center opacity-0 transition-opacity duration-150 group-hover:opacity-100",
          item.isPinned && "opacity-100",
        )}
        onClick={(e) => {
          e.stopPropagation();
          onPin(item);
        }}
      >
        {item.isPinned ? (
          <BookmarkCheck className="h-3.5 w-3.5 text-hanover-green" />
        ) : (
          <Bookmark className="h-3.5 w-3.5 text-muted-foreground hover:text-hanover-green" />
        )}
      </button>
    </div>
  );
}
