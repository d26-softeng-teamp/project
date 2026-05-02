import { ChevronDown, ChevronRight, Lock, Unlock } from "lucide-react";
import { Link } from "react-router";
import { useContentFilterStore } from "@/store/content-filters";
import { useFavorites } from "@/store/favorites";
import type { ContentItem } from "@/types/content";
import { renderTag } from "@/utils/tag";
import { ContentCard } from "./ContentCard";

type CheckinMutation = {
  mutate: (args: { fileID: string }) => void;
};

type ToggleFavoriteMutation = {
  mutate: (args: { fileID: string }) => void;
};

type Props = {
  label: string;
  items: ContentItem[];
  view: "grid" | "list";
  currentUserId?: string;
  searchQuery?: string;
  toggleFavorite: ToggleFavoriteMutation;
  checkin: CheckinMutation;
  getStatusBadge: (status?: string) => string;
};

function checkedOutLabel(isCheckedOutByMe: boolean, name: string | undefined): string {
  if (isCheckedOutByMe) return "Checked out by you";
  if (name) return `Checked out by ${name}`;
  return "Checked out";
}

function parseContentDate(value: string): Date {
  const [datePart] = value.split("T");
  const [year, month, day] = datePart.split("-").map(Number);

  if (year && month && day) {
    return new Date(year, month - 1, day);
  }

  return new Date(value);
}

function formatContentDate(value?: string | null): string {
  if (!value) return "-";

  return parseContentDate(value).toLocaleDateString();
}

function isContentOverdue(item: ContentItem): boolean {
  if (!item.next_review_date) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const reviewDate = parseContentDate(item.next_review_date);

  return reviewDate < today;
}

function PositionListItem({
  item,
  currentUserId,
  searchQuery,
  toggleFavorite,
  checkin,
  getStatusBadge,
}: Omit<Props, "label" | "items" | "view"> & { item: ContentItem }) {
  const tags = item.content_tags ?? [];
  const visibleTags = tags.slice(0, 2);
  const hiddenCount = tags.length - 2;
  const { isFavorited } = useFavorites();
  const isCheckedOutByMe = !!(item.is_checked_out && item.checked_out_by === currentUserId);
  const checkedOutByName = item.checked_out_by_user?.name;
  const isOverdue = isContentOverdue(item);

  const detailHref = searchQuery
    ? `/hero/content/${item.fileID}/edit?q=${encodeURIComponent(searchQuery)}`
    : `/hero/content/${item.fileID}/edit`;

  return (
    <Link
      to={detailHref}
      className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-muted/50 ${
        isOverdue ? "bg-red-50/40" : ""
      }`}
    >
      <span className="min-w-0 flex-2 truncate font-medium text-foreground">
        {item.filename ?? "Untitled"}
      </span>

      <span
        className={`shrink-0 rounded px-2 py-0.5 text-xs font-semibold ${getStatusBadge(
          item.document_status,
        )}`}
      >
        {item.document_status ?? "-"}
      </span>

      <div className="flex shrink-0 items-center gap-1">
        {visibleTags.map((ct) => {
          const styles = renderTag(ct.tag);
          return (
            <span
              key={ct.tag.id}
              style={{ backgroundColor: styles.bg, color: styles.text }}
              className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
            >
              {ct.tag.name}
            </span>
          );
        })}
        {hiddenCount > 0 && (
          <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            +{hiddenCount}
          </span>
        )}
      </div>

      {item.is_checked_out && (
        <div className="flex shrink-0 items-center gap-1.5 rounded bg-amber-50 px-2 py-1">
          <div className="flex items-center gap-1 text-xs font-semibold text-amber-700">
            <Lock className="h-3 w-3" />
            {checkedOutLabel(isCheckedOutByMe, checkedOutByName)}
          </div>
          {isCheckedOutByMe && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                checkin.mutate({ fileID: item.fileID });
              }}
              className="inline-flex items-center gap-1 rounded bg-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-900 transition-colors hover:bg-amber-300"
            >
              <Unlock className="h-3 w-3" />
              Check In
            </button>
          )}
        </div>
      )}

      {isOverdue && <span className="shrink-0 text-xs font-semibold text-red-600">Overdue</span>}

      <span className="w-28 shrink-0 truncate text-xs text-muted-foreground">
        {item.owner?.name ?? "Unassigned"}
      </span>

      <span
        className={`w-20 shrink-0 text-right text-xs ${
          isOverdue ? "font-medium text-red-800" : "text-muted-foreground"
        }`}
      >
        {item.next_review_date
          ? formatContentDate(item.next_review_date)
          : item.last_modified
            ? formatContentDate(item.last_modified)
            : "-"}
      </span>

      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleFavorite.mutate({ fileID: item.fileID });
        }}
        className="shrink-0 text-yellow-400"
        aria-label={isFavorited(item.fileID) ? "Remove from favorites" : "Add to favorites"}
      >
        {isFavorited(item.fileID) ? "★" : "☆"}
      </button>
    </Link>
  );
}

export function PositionGroup({
  label,
  items,
  view,
  currentUserId,
  searchQuery,
  toggleFavorite,
  checkin,
  getStatusBadge,
}: Props) {
  const groupKey = `position:${label}`;
  const isCollapsed = useContentFilterStore((state) => state.collapsedGroups[groupKey]);
  const setGroupCollapsed = useContentFilterStore((state) => state.setGroupCollapsed);
  const open = !isCollapsed;

  return (
    <section className="pb-1">
      <button
        type="button"
        onClick={() => setGroupCollapsed(groupKey, open)}
        className="mb-3 flex w-full items-center justify-between rounded-lg border border-border bg-card px-3.5 py-2.5 text-left shadow-sm transition-colors hover:bg-muted/40"
        aria-expanded={open}
      >
        <span className="flex min-w-0 items-center gap-2">
          {open ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          <span className="truncate text-sm font-semibold text-foreground">{label}</span>
        </span>
        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {items.length}
        </span>
      </button>

      {open &&
        (view === "grid" ? (
          <div
            style={{
              display: "grid",
              gap: "0.875rem",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            }}
          >
            {items.map((item) => (
              <ContentCard
                key={item.fileID}
                item={item}
                currentUserId={currentUserId}
                searchQuery={searchQuery}
                toggleFavorite={toggleFavorite}
                checkin={checkin}
                getStatusBadge={getStatusBadge}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-border rounded border border-border bg-card">
            {items.map((item) => (
              <PositionListItem
                key={item.fileID}
                item={item}
                currentUserId={currentUserId}
                searchQuery={searchQuery}
                toggleFavorite={toggleFavorite}
                checkin={checkin}
                getStatusBadge={getStatusBadge}
              />
            ))}
          </div>
        ))}
    </section>
  );
}
