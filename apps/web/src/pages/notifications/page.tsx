import { cn } from "@myapp/ui/lib/utils";
import { Bell, Loader2, RefreshCw, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "@/auth/session-context";
import type { RouterOutputs } from "@/lib/trpc";
import { trpc } from "@/lib/trpc";
import { FilterRail } from "./components/filter-rail";
import { NotificationRow } from "./components/notification-row";
import { PreviewPane } from "./components/preview-pane";
import { SelectionToolbar } from "./components/selection-toolbar";
import { useNotificationSelection } from "./hooks/use-notification-selection";
import type { FilterKey, NotificationItem } from "./types";

// ---------------------------------------------------------------------------
// Filter helpers
// ---------------------------------------------------------------------------

function matchesFilter(item: NotificationItem, filter: FilterKey): boolean {
  switch (filter) {
    case "all":
      return true;
    case "unread":
      return !item.isRead;
    case "pinned":
      return item.isPinned;
    case "changes":
      return item.type === "document-change";
    case "ownership":
      return item.type === "ownership-update";
    default:
      return true;
  }
}

function buildCounts(items: NotificationItem[]): Record<FilterKey, number> {
  return {
    all: items.length,
    unread: items.filter((i) => !i.isRead).length,
    pinned: items.filter((i) => i.isPinned).length,
    changes: items.filter((i) => i.type === "document-change").length,
    ownership: items.filter((i) => i.type === "ownership-update").length,
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function NotificationsView() {
  const { session } = useSession();
  const utils = trpc.useUtils();

  const listQuery = trpc.notifications.myList.useQuery(undefined, {
    enabled: Boolean(session),
    staleTime: 30_000,
  });

  // ---------------------------------------------------------------------
  // Optimistic mutations — update the cache immediately so the UI reflects
  // user intent without waiting for the server round-trip. On error, roll
  // back. On settle, refetch to reconcile any drift (e.g. ordering).
  // ---------------------------------------------------------------------

  type ListData = NonNullable<RouterOutputs["notifications"]["myList"]>;
  type ApiItem = ListData["items"][number];

  function patchCache(
    update: (items: NotificationItem[]) => NotificationItem[],
  ): ListData | undefined {
    const prev = utils.notifications.myList.getData();
    if (!prev) return undefined;
    const items = update(prev.items as NotificationItem[]);
    const unreadCount = items.filter((i) => !i.isRead).length;
    utils.notifications.myList.setData(undefined, {
      items: items as unknown as ApiItem[],
      unreadCount,
    });
    return prev;
  }

  const setReadMutation = trpc.notifications.setRead.useMutation({
    onMutate: async ({ keys, read }) => {
      await utils.notifications.myList.cancel();
      const keySet = new Set(keys);
      const prev = patchCache((items) =>
        items.map((i) => (keySet.has(i.id) ? { ...i, isRead: read } : i)),
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) utils.notifications.myList.setData(undefined, ctx.prev);
    },
    onSettled: () => utils.notifications.myList.invalidate(),
  });

  const setPinnedMutation = trpc.notifications.setPinned.useMutation({
    onMutate: async ({ keys, pinned }) => {
      await utils.notifications.myList.cancel();
      const keySet = new Set(keys);
      const prev = patchCache((items) =>
        items.map((i) => (keySet.has(i.id) ? { ...i, isPinned: pinned } : i)),
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) utils.notifications.myList.setData(undefined, ctx.prev);
    },
    onSettled: () => utils.notifications.myList.invalidate(),
  });

  const deleteMutation = trpc.notifications.delete.useMutation({
    onMutate: async ({ keys }) => {
      await utils.notifications.myList.cancel();
      const keySet = new Set(keys);
      const prev = patchCache((items) => items.filter((i) => !keySet.has(i.id)));
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) utils.notifications.myList.setData(undefined, ctx.prev);
    },
    onSettled: () => utils.notifications.myList.invalidate(),
  });

  const isMutating =
    setReadMutation.isPending || setPinnedMutation.isPending || deleteMutation.isPending;

  // UI state
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [showPreviewMobile, setShowPreviewMobile] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const allItems = listQuery.data?.items ?? [];
  const activeItem = activeItemId ? (allItems.find((i) => i.id === activeItemId) ?? null) : null;

  // Apply filter + search
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allItems
      .filter((item) => matchesFilter(item, activeFilter))
      .filter(
        (item) =>
          !q ||
          item.fileName.toLowerCase().includes(q) ||
          item.message.toLowerCase().includes(q) ||
          (item.actorName?.toLowerCase().includes(q) ?? false),
      );
  }, [allItems, activeFilter, searchQuery]);

  const filteredIds = useMemo(() => filteredItems.map((i) => i.id), [filteredItems]);
  const counts = useMemo(() => buildCounts(allItems), [allItems]);

  const { toggle, selectAll, clearAll, isSelected, count, hasSelection } =
    useNotificationSelection(filteredIds);

  // Mark as read immediately on click. With optimistic updates the dot/bold
  // disappear instantly; the server call completes in the background.
  const openPreview = useCallback(
    (item: NotificationItem) => {
      setActiveItemId(item.id);
      setShowPreviewMobile(true);
      if (!item.isRead) {
        setReadMutation.mutate({ keys: [item.id], read: true });
      }
    },
    [setReadMutation],
  );

  // Keyboard shortcuts
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "/") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "Escape") {
        setActiveItemId(null);
        setShowPreviewMobile(false);
        clearAll();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [clearAll]);

  // Bulk action helpers
  const selectedItems = useMemo(
    () => filteredItems.filter((i) => isSelected(i.id)),
    [filteredItems, isSelected],
  );
  const selectedKeys = useMemo(() => selectedItems.map((i) => i.id), [selectedItems]);
  const allSelectedRead = selectedItems.length > 0 && selectedItems.every((i) => i.isRead);
  const allSelectedPinned = selectedItems.length > 0 && selectedItems.every((i) => i.isPinned);

  function handleBulkMarkRead() {
    setReadMutation.mutate({ keys: selectedKeys, read: true });
    clearAll();
  }
  function handleBulkMarkUnread() {
    setReadMutation.mutate({ keys: selectedKeys, read: false });
    clearAll();
  }
  function handleBulkPin() {
    setPinnedMutation.mutate({ keys: selectedKeys, pinned: true });
    clearAll();
  }
  function handleBulkUnpin() {
    setPinnedMutation.mutate({ keys: selectedKeys, pinned: false });
    clearAll();
  }
  function handleBulkDelete() {
    deleteMutation.mutate({ keys: selectedKeys });
    if (activeItemId && selectedKeys.includes(activeItemId)) {
      setActiveItemId(null);
      setShowPreviewMobile(false);
    }
    clearAll();
  }
  function handlePin(item: NotificationItem) {
    setPinnedMutation.mutate({ keys: [item.id], pinned: !item.isPinned });
  }
  function handleDelete(item: NotificationItem) {
    deleteMutation.mutate({ keys: [item.id] });
    if (activeItemId === item.id) {
      setActiveItemId(null);
      setShowPreviewMobile(false);
    }
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  if (listQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-hanover-green" />
      </div>
    );
  }

  if (listQuery.isError) {
    return (
      <div className="min-h-[calc(100vh-2.75rem)] bg-muted px-4 py-10">
        <div className="mx-auto max-w-xl rounded border border-border bg-card p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-foreground">Notifications</h1>
          <p className="mt-3 font-medium text-destructive">Could not load notifications.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {listQuery.error instanceof Error ? listQuery.error.message : "Unknown error"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-2.75rem)] flex-col overflow-hidden bg-muted">
      {/* Page header */}
      <div className="shrink-0 border-b border-border bg-card px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-screen-xl items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-hanover-green/10">
            <Bell className="h-5 w-5 text-hanover-green" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Activity
              {(listQuery.data?.unreadCount ?? 0) > 0 && (
                <span className="ml-2 rounded-full bg-hanover-green px-2 py-0.5 text-xs font-semibold text-white">
                  {listQuery.data?.unreadCount}
                </span>
              )}
            </h1>
            <p className="text-xs text-muted-foreground">
              Edits and ownership transfers on documents in your role.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => utils.notifications.myList.invalidate()}
              disabled={listQuery.isFetching}
              aria-label="Refresh"
              className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", listQuery.isFetching && "animate-spin")} />
            </button>
          </div>
        </div>
      </div>

      {/* Three-pane layout */}
      <div className="mx-auto flex min-h-0 w-full max-w-screen-xl flex-1 flex-col overflow-hidden lg:flex-row">
        {/* Filter rail */}
        <FilterRail
          activeFilter={activeFilter}
          onFilter={(key) => {
            setActiveFilter(key);
            clearAll();
          }}
          counts={counts}
        />

        {/* List + preview */}
        <div className="flex min-h-0 flex-1 overflow-hidden">
          {/* List pane */}
          <div
            className={cn(
              "flex min-h-0 flex-col border-r border-border bg-card",
              "w-full lg:w-[420px] lg:shrink-0",
              // On mobile: hide list when preview is open
              showPreviewMobile && activeItem ? "hidden lg:flex" : "flex",
            )}
          >
            {/* Search bar — sticky at top of pane */}
            <div className="shrink-0 border-b border-border bg-card px-3 py-2">
              <div className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5">
                <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search notifications… (/)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            {/* Selection toolbar */}
            {hasSelection && (
              <div className="shrink-0">
                <SelectionToolbar
                  count={count}
                  totalCount={filteredIds.length}
                  allRead={allSelectedRead}
                  allPinned={allSelectedPinned}
                  onMarkRead={handleBulkMarkRead}
                  onMarkUnread={handleBulkMarkUnread}
                  onPin={handleBulkPin}
                  onUnpin={handleBulkUnpin}
                  onDelete={handleBulkDelete}
                  onClear={clearAll}
                  onSelectAll={selectAll}
                  isLoading={isMutating}
                />
              </div>
            )}

            {/* Row count hint */}
            {!hasSelection && filteredItems.length > 0 && (
              <div className="flex shrink-0 items-center gap-2 border-b border-border bg-card px-4 py-2">
                <p className="text-xs text-muted-foreground">
                  {filteredItems.length} notification{filteredItems.length !== 1 ? "s" : ""}
                  {searchQuery && ` matching "${searchQuery}"`}
                </p>
                {counts.unread > 0 && (activeFilter === "all" || activeFilter === "unread") && (
                  <button
                    type="button"
                    onClick={() => {
                      setReadMutation.mutate({
                        keys: allItems.filter((i) => !i.isRead).map((i) => i.id),
                        read: true,
                      });
                    }}
                    className="ml-auto text-xs text-hanover-green underline-offset-2 hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>
            )}

            {/* List — the only scrollable region */}
            <div
              className="notif-scroll min-h-0 flex-1 overflow-y-auto"
              role="listbox"
              aria-label="Notifications"
            >
              {filteredItems.length === 0 ? (
                <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {searchQuery
                      ? "No results for your search."
                      : activeFilter === "unread"
                        ? "You're all caught up."
                        : activeFilter === "pinned"
                          ? "No pinned notifications yet."
                          : "Nothing to show right now."}
                  </p>
                </div>
              ) : (
                filteredItems.map((item) => (
                  <NotificationRow
                    key={item.id}
                    item={item}
                    isSelected={isSelected(item.id)}
                    isActive={activeItem?.id === item.id}
                    onSelect={toggle}
                    onOpen={openPreview}
                    onPin={handlePin}
                  />
                ))
              )}
            </div>
          </div>

          {/* Preview pane */}
          <div
            className={cn(
              "min-h-0 flex-1 overflow-hidden",
              // Mobile: full screen when open
              showPreviewMobile && activeItem ? "flex flex-col" : "hidden lg:flex lg:flex-col",
            )}
          >
            <PreviewPane
              item={activeItem}
              onClose={() => {
                setActiveItemId(null);
                setShowPreviewMobile(false);
              }}
              onPin={handlePin}
              onDelete={handleDelete}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default NotificationsView;
