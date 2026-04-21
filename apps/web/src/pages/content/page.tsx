import { Plus, Search } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { useSession } from "@/auth/session-context";
import { trpc } from "@/lib/trpc.ts";
import { normalizeContent } from "@/utils/normalizeContent.ts";
import { ContentFilters } from "./components/ContentFilters";
import { ContentGrid } from "./components/ContentGrid";
import { useContentFilters } from "./hooks/useContentFilters";
import { useDebouncedValue } from "./hooks/useDebouncedValue";

const ROLE_TABS = [
  { key: "all", label: "All Users" },
  { key: "underwriter", label: "Underwriter" },
  { key: "business-analyst", label: "Business Analyst" },
  { key: "actuarial-analyst", label: "Actuarial Analyst" },
  { key: "exl-operations", label: "EXL Operations" },
];

function getStatusBadge(status?: string | null) {
  switch (status) {
    case "Finalized":
      return "bg-hanover-green text-white";
    case "Created":
      return "bg-[#C9A84C] text-white";
    case "in-progress":
      return "bg-blue-500 text-white whitespace-nowrap";
    case "Archived":
      return "bg-gray-400 text-white";
    default:
      return "bg-muted text-muted-foreground";
  }
}
export default function ContentPage() {
  trpc.user.myAccess.useQuery();
  const filters = useContentFilters();
  const debouncedSearch = useDebouncedValue(filters.search, 300);
  const { session } = useSession();
  const currentUserId = session?.user?.id;

  const [openRole, setOpenRole] = useState(true);
  const [openStatus, setOpenStatus] = useState(true);
  const [openType, setOpenType] = useState(true);
  const [openTags, setOpenTags] = useState(true);

  const utils = trpc.useUtils();

  const toggleFavorite = trpc.content.update.useMutation({
    onSuccess: () => utils.content.list.invalidate(),
  });

  const checkin = trpc.content.checkin.useMutation({
    onSuccess: () => utils.content.list.invalidate(),
  });

  const contents = trpc.content.list.useQuery({
    search: debouncedSearch,
    document_status: filters.status || undefined,
    content_type: (filters.type as "Reference" | "Workflow") || undefined,
    role: filters.role === "all" ? undefined : filters.role,
    tagIds: filters.tagIds.length > 0 ? filters.tagIds : undefined,
    tagMatchMode: filters.tagIds.length > 0 ? filters.tagMode : undefined,
    pinnedTagId: filters.pinnedTagId ?? undefined,
  });

  const allItems = contents.data?.map(normalizeContent) ?? [];

  const filtered = allItems;

  return (
    <div className="border-t border-border/60 py-6 sm:py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex justify-end">
          <div className="flex w-full max-w-4xl items-center gap-3">
            <div className="relative flex-[2]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={filters.search}
                onChange={(e) => filters.setSearch(e.target.value)}
                placeholder="Search by filename or URL..."
                className="w-full rounded border border-border bg-background py-2 pl-10 pr-4 text-sm"
              />
            </div>

            <div className="relative">
              <select
                value={filters.view}
                onChange={(e) => filters.setView(e.target.value as "grid" | "list")}
                className="appearance-none rounded border border-border bg-background px-3 py-2 pr-8 text-sm font-medium hover:bg-muted"
              >
                <option value="grid">Card View</option>
                <option value="list">List View</option>
              </select>

              <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                ▾
              </div>
            </div>

            {/* NEW CONTENT */}
            <Link
              to="/hero/content/new"
              className="flex shrink-0 items-center gap-2 rounded bg-hanover-green px-4 py-2 text-sm font-semibold text-white"
            >
              <Plus className="h-4 w-4" />
              New Content
            </Link>
          </div>
        </div>

        <div className="flex gap-6">
          {/* SIDEBAR */}
          <ContentFilters
            filters={filters}
            openRole={openRole}
            setOpenRole={setOpenRole}
            openStatus={openStatus}
            setOpenStatus={setOpenStatus}
            openType={openType}
            setOpenType={setOpenType}
            openTags={openTags}
            setOpenTags={setOpenTags}
            ROLE_TABS={ROLE_TABS}
          />

          {/* Grid view */}
          <ContentGrid
            contents={contents}
            filtered={filtered}
            filters={filters}
            currentUserId={currentUserId}
            toggleFavorite={toggleFavorite}
            checkin={checkin}
            getStatusBadge={getStatusBadge}
          />
        </div>
      </div>
    </div>
  );
}
