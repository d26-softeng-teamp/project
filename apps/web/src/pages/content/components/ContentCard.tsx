import { Lock, Unlock } from "lucide-react";
import { Link } from "react-router";
import { useFavorites } from "@/store/favorites";
import type { ContentItem } from "@/types/content";
import { renderTag } from "@/utils/tag";

type CheckinMutation = {
  mutate: (args: { fileID: string }) => void;
};

type Props = {
  item: ContentItem;
  currentUserId?: string;
  toggleFavorite: {
    mutate: (args: { fileID: string }) => void;
  };
  checkin: CheckinMutation;
  getStatusBadge: (status?: string) => string;
};

function checkedOutLabel(isCheckedOutByMe: boolean, name: string | undefined): string {
  if (isCheckedOutByMe) return "Checked out by you";
  if (name) return `Checked out by ${name}`;
  return "Checked out";
}

export function ContentCard({
  item,
  currentUserId,
  toggleFavorite,
  checkin,
  getStatusBadge,
}: Props) {
  const MAX_VISIBLE_TAGS = 3;
  const tags = item.content_tags ?? [];
  const visibleTags = tags.slice(0, MAX_VISIBLE_TAGS);
  const hiddenCount = tags.length - MAX_VISIBLE_TAGS;
  const { isFavorited } = useFavorites();
  const isCheckedOutByMe = !!(item.is_checked_out && item.checked_out_by === currentUserId);
  const checkedOutByName = item.checked_out_by_user?.name;

  return (
    <Link
      to={`/hero/content/${item.fileID}/edit`}
      className="group rounded border border-border bg-card shadow-sm transition-all hover:border-hanover-green hover:shadow-md p-5"
    >
      {/* HEADER */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold leading-snug text-foreground group-hover:text-hanover-green line-clamp-2 break-words">
          {item.filename ?? "Untitled"}
        </h3>

        <div className="flex shrink-0 items-center gap-1">
          <span
            className={`rounded px-2 py-0.5 text-xs font-semibold ${getStatusBadge(
              item.document_status,
            )}`}
          >
            {item.document_status ?? "—"}
          </span>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();

              toggleFavorite.mutate({
                fileID: item.fileID,
              });
            }}
            className="text-yellow-400"
          >
            {isFavorited(item.fileID) ? "★" : "☆"}
          </button>
        </div>
      </div>

      {/* META */}
      <p className="mb-1 truncate text-xs text-muted-foreground">{item.url}</p>
      <p className="mb-1 text-xs text-muted-foreground">
        {item.content_type ?? "—"} · {item.job_position ?? "—"}
      </p>

      {/* TAGS */}
      {tags.length ? (
        <div className="group/tags mb-2 flex flex-wrap gap-x-1 gap-y-1.5">
          {visibleTags.map((ct) => {
            const styles = renderTag(ct.tag);

            return (
              <span
                key={ct.tag.id}
                style={{
                  backgroundColor: styles.bg,
                  color: styles.text,
                }}
                className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium transition-all hover:opacity-80"
              >
                {ct.tag.name}
              </span>
            );
          })}

          {hiddenCount > 0 && (
            <div className="relative">
              <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground cursor-default">
                +{hiddenCount} more
              </span>

              <div className="pointer-events-none absolute left-0 top-full z-10 mt-1 hidden max-w-[200px] flex-wrap gap-1 rounded border border-border bg-background p-2 shadow-md group-hover/tags:flex">
                {tags.slice(MAX_VISIBLE_TAGS).map((ct) => {
                  const styles = renderTag(ct.tag);

                  return (
                    <span
                      key={ct.tag.id}
                      style={{
                        backgroundColor: styles.bg,
                        color: styles.text,
                      }}
                      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                    >
                      {ct.tag.name}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* CHECKED OUT */}
      {item.is_checked_out && (
        <div className="mb-2 flex items-center justify-between gap-2 rounded bg-amber-50 px-2 py-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700">
            <Lock className="h-3 w-3" />
            {checkedOutLabel(isCheckedOutByMe, checkedOutByName)}
          </div>
          {isCheckedOutByMe && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
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

      {/* FOOTER */}
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="truncate max-w-[60%]">{item.owner?.name ?? "Unassigned"}</span>

        <span className="shrink-0">
          {item.last_modified ? new Date(item.last_modified).toLocaleDateString() : "—"}
        </span>
      </div>
    </Link>
  );
}
