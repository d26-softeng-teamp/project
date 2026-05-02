import { cn } from "@myapp/ui/lib/utils";
import {
  Bell,
  Bookmark,
  BookmarkCheck,
  Clock3,
  ExternalLink,
  FilePenLine,
  Megaphone,
  TriangleAlert,
  UserRoundCog,
  X,
} from "lucide-react";
import { Link } from "react-router";
import type { NotificationItem } from "../types";

interface PreviewPaneProps {
  item: NotificationItem | null;
  onClose: () => void;
  onPin: (item: NotificationItem) => void;
  onDelete: (item: NotificationItem) => void;
}

function formatFullDate(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function TypeIcon({ type }: { type: NotificationItem["type"] }) {
  switch (type) {
    case "document-change":
      return <FilePenLine className="h-5 w-5" />;
    case "expiration":
      return <Clock3 className="h-5 w-5" />;
    case "ownership-update":
      return <UserRoundCog className="h-5 w-5" />;
    case "announcement":
      return <Megaphone className="h-5 w-5" />;
    default:
      return <Bell className="h-5 w-5" />;
  }
}

function iconColorClass(urgency: NotificationItem["urgency"]) {
  switch (urgency) {
    case "critical":
      return "text-destructive bg-destructive/10";
    case "high":
      return "text-[#EA580C] bg-[#EA580C]/10";
    case "warning":
      return "text-[#C9A84C] bg-[#C9A84C]/10";
    default:
      return "text-hanover-green bg-hanover-green/10";
  }
}

function typeLabel(type: NotificationItem["type"]) {
  switch (type) {
    case "document-change":
      return "Document Update";
    case "expiration":
      return "Review / Expiry Notice";
    case "ownership-update":
      return "Ownership Change";
    case "announcement":
      return "Announcement";
    default:
      return "Notification";
  }
}

export function PreviewPane({ item, onClose, onPin, onDelete }: PreviewPaneProps) {
  if (!item) {
    return (
      <div className="hidden flex-1 items-center justify-center bg-muted/30 lg:flex">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Bell className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">Select a notification to preview</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-card">
      {/* Header bar */}
      <div className="flex shrink-0 items-center gap-2 border-b border-border px-5 py-3">
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
            iconColorClass(item.urgency),
          )}
        >
          <TypeIcon type={item.type} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {typeLabel(item.type)}
            {item.urgency === "critical" && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-destructive/10 px-1.5 py-0.5 text-[10px] font-semibold normal-case tracking-normal text-destructive">
                <TriangleAlert className="h-2.5 w-2.5" />
                Urgent
              </span>
            )}
            {item.urgency === "high" && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-[#EA580C]/10 px-1.5 py-0.5 text-[10px] font-semibold normal-case tracking-normal text-[#EA580C]">
                This week
              </span>
            )}
            {item.urgency === "warning" && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-[#C9A84C]/10 px-1.5 py-0.5 text-[10px] font-semibold normal-case tracking-normal text-[#C9A84C]">
                Soon
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPin(item)}
            aria-label={item.isPinned ? "Unpin" : "Pin"}
            className="flex h-7 w-7 items-center justify-center rounded hover:bg-muted"
          >
            {item.isPinned ? (
              <BookmarkCheck className="h-4 w-4 text-hanover-green" />
            ) : (
              <Bookmark className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            className="flex h-7 w-7 items-center justify-center rounded hover:bg-muted lg:hidden"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="notif-scroll min-h-0 flex-1 overflow-y-auto px-5 py-5">
        {/* Title */}
        <h2 className="text-xl font-semibold leading-snug text-foreground">{item.fileName}</h2>

        {/* Meta */}
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>{formatFullDate(item.createdAt)}</span>
          {item.actorName && (
            <span>
              By <span className="font-medium text-foreground">{item.actorName}</span>
            </span>
          )}
        </div>

        {/* Message body */}
        <div
          className={cn(
            "mt-5 rounded-lg border-l-4 p-4 text-sm leading-relaxed",
            item.urgency === "critical" && "border-destructive bg-destructive/5 text-foreground",
            item.urgency === "high" && "border-[#EA580C] bg-[#EA580C]/5 text-foreground",
            item.urgency === "warning" && "border-[#C9A84C] bg-[#C9A84C]/5 text-foreground",
            item.urgency === "info" && "border-hanover-green/40 bg-muted/50 text-foreground",
          )}
        >
          {item.message}
        </div>

        {/* Document link (for non-announcements) */}
        {item.fileID && (
          <div className="mt-5 rounded-lg border border-border bg-muted/30 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Related Document
            </p>
            <p className="mb-3 text-sm font-medium text-foreground">{item.fileName}</p>
            <Link
              to={`/hero/content/${item.fileID}/edit`}
              className="inline-flex items-center gap-1.5 rounded-md bg-hanover-green px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-hanover-green/90"
            >
              Open document
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}

        {/* Delete */}
        <div className="mt-6 border-t border-border pt-4">
          <button
            type="button"
            onClick={() => onDelete(item)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-destructive"
          >
            Remove this notification
          </button>
        </div>
      </div>
    </div>
  );
}
