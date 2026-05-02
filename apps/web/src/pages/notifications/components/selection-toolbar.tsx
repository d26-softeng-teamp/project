import { cn } from "@myapp/ui/lib/utils";
import { Bookmark, BookmarkCheck, MailOpen, MailX, Trash2, X } from "lucide-react";

interface SelectionToolbarProps {
  count: number;
  totalCount: number;
  allRead: boolean;
  allPinned: boolean;
  onMarkRead: () => void;
  onMarkUnread: () => void;
  onPin: () => void;
  onUnpin: () => void;
  onDelete: () => void;
  onClear: () => void;
  onSelectAll: () => void;
  isLoading: boolean;
}

export function SelectionToolbar({
  count,
  totalCount,
  allRead,
  allPinned,
  onMarkRead,
  onMarkUnread,
  onPin,
  onUnpin,
  onDelete,
  onClear,
  onSelectAll,
  isLoading,
}: SelectionToolbarProps) {
  return (
    <div
      className={cn(
        "animate-fade-in-down flex items-center gap-1 border-b border-border bg-hanover-green/5 px-3 py-2",
        isLoading && "pointer-events-none opacity-60",
      )}
    >
      <button
        type="button"
        onClick={onClear}
        className="mr-1 flex h-6 w-6 items-center justify-center rounded hover:bg-muted"
        aria-label="Clear selection"
      >
        <X className="h-3.5 w-3.5 text-muted-foreground" />
      </button>

      <span className="text-xs font-semibold text-foreground">{count} selected</span>

      {count < totalCount && (
        <button
          type="button"
          onClick={onSelectAll}
          className="ml-1 text-xs text-hanover-green underline-offset-2 hover:underline"
        >
          Select all {totalCount}
        </button>
      )}

      <div className="mx-2 h-4 w-px bg-border" />

      {/* Actions */}
      <ToolbarButton onClick={onMarkRead} label="Mark read" disabled={allRead}>
        <MailOpen className="h-3.5 w-3.5" />
      </ToolbarButton>

      <ToolbarButton onClick={onMarkUnread} label="Mark unread" disabled={!allRead}>
        <MailX className="h-3.5 w-3.5" />
      </ToolbarButton>

      <div className="mx-1 h-4 w-px bg-border" />

      {allPinned ? (
        <ToolbarButton onClick={onUnpin} label="Unpin">
          <BookmarkCheck className="h-3.5 w-3.5 text-hanover-green" />
        </ToolbarButton>
      ) : (
        <ToolbarButton onClick={onPin} label="Pin">
          <Bookmark className="h-3.5 w-3.5" />
        </ToolbarButton>
      )}

      <div className="mx-1 h-4 w-px bg-border" />

      <ToolbarButton
        onClick={onDelete}
        label="Delete"
        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </ToolbarButton>
    </div>
  );
}

function ToolbarButton({
  children,
  label,
  onClick,
  disabled,
  className,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={cn(
        "flex h-7 items-center gap-1.5 rounded px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40",
        className,
      )}
    >
      {children}
      <span className="hidden sm:block">{label}</span>
    </button>
  );
}
