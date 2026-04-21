import { Loader2 } from "lucide-react";
import type { ContentItem } from "@/types/content";
import { ContentCard } from "./ContentCard";
import { ContentListItem } from "./ContentListItem";

type ToggleFavorite = {
  mutate: (args: { fileID: string; is_favorited: boolean }) => void;
};

type CheckinMutation = {
  mutate: (args: { fileID: string }) => void;
};

type StatusFn = (status?: string) => string;

type Filters = {
  view: "grid" | "list";
};

type Props = {
  contents: {
    isLoading: boolean;
  };
  filtered: ContentItem[];
  filters: Filters;
  currentUserId?: string;
  toggleFavorite: ToggleFavorite;
  checkin: CheckinMutation;
  getStatusBadge: StatusFn;
};

export function ContentGrid({
  contents,
  filtered,
  filters,
  currentUserId,
  toggleFavorite,
  checkin,
  getStatusBadge,
}: Props) {
  return (
    <main className="flex-1">
      {contents.isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-hanover-green" />
        </div>
      ) : (
        <div
          className={
            filters.view === "grid"
              ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3"
              : "flex flex-col gap-3"
          }
        >
          {filtered.map((item) =>
            filters.view === "grid" ? (
              <ContentCard
                key={item.fileID}
                item={item}
                currentUserId={currentUserId}
                toggleFavorite={toggleFavorite}
                checkin={checkin}
                getStatusBadge={getStatusBadge}
              />
            ) : (
              <ContentListItem
                key={item.fileID}
                item={item}
                currentUserId={currentUserId}
                toggleFavorite={toggleFavorite}
                checkin={checkin}
                getStatusBadge={getStatusBadge}
              />
            ),
          )}
        </div>
      )}
    </main>
  );
}
