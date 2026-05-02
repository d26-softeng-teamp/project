import { ChevronDown, Loader2, Megaphone, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useSession } from "@/auth/session-context";
import { trpc } from "@/lib/trpc";
import { ComposeAnnouncementDialog } from "@/pages/notifications/components/compose-announcement-dialog";
import { AnnouncementCard } from "./components/AnnouncementCard";

function AnnouncementsPage() {
  const { session } = useSession();
  const accessQuery = trpc.user.myAccess.useQuery();
  const isAdmin = accessQuery.data?.role === "admin";
  const utils = trpc.useUtils();

  const listQuery = trpc.notifications.listAnnouncements.useQuery(undefined, {
    enabled: Boolean(session),
    staleTime: 30_000,
  });

  const setReadMutation = trpc.notifications.setRead.useMutation({
    onMutate: async ({ keys, read }) => {
      await utils.notifications.listAnnouncements.cancel();
      const prev = utils.notifications.listAnnouncements.getData();
      if (!prev) return { prev };
      const keySet = new Set(keys);
      const patch = (items: typeof prev.active) =>
        items.map((i) => (keySet.has(i.id) ? { ...i, isRead: read } : i));
      const active = patch(prev.active);
      const archive = patch(prev.archive);
      utils.notifications.listAnnouncements.setData(undefined, {
        active,
        archive,
        unreadCount: active.filter((i) => !i.isRead).length,
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) utils.notifications.listAnnouncements.setData(undefined, ctx.prev);
    },
    onSettled: () => utils.notifications.listAnnouncements.invalidate(),
  });

  const [showCompose, setShowCompose] = useState(false);
  const [showArchive, setShowArchive] = useState(false);

  const active = listQuery.data?.active ?? [];
  const archive = listQuery.data?.archive ?? [];
  const unreadCount = listQuery.data?.unreadCount ?? 0;

  function handleMarkRead(id: string) {
    setReadMutation.mutate({ keys: [id], read: true });
  }

  function handleMarkAllRead() {
    const keys = active.filter((i) => !i.isRead).map((i) => i.id);
    if (keys.length === 0) return;
    setReadMutation.mutate({ keys, read: true });
  }

  return (
    <>
      <div className="min-h-[calc(100vh-2.75rem)] bg-muted">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
          {/* Header */}
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-hanover-green/10">
              <Megaphone className="h-5 w-5 text-hanover-green" />
            </span>
            <div className="flex-1">
              <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-foreground">
                Announcements
                {unreadCount > 0 && (
                  <span className="rounded-full bg-hanover-green px-2 py-0.5 text-xs font-semibold text-white">
                    {unreadCount}
                  </span>
                )}
              </h1>
              <p className="text-xs text-muted-foreground">
                Updates from administrators relevant to your role.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => utils.notifications.listAnnouncements.invalidate()}
                disabled={listQuery.isFetching}
                aria-label="Refresh"
                className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${listQuery.isFetching ? "animate-spin" : ""}`}
                />
              </button>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                >
                  Mark all read
                </button>
              )}
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setShowCompose(true)}
                  className="flex items-center gap-1.5 rounded-md bg-hanover-green px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-hanover-green/90"
                >
                  <Megaphone className="h-3.5 w-3.5" />
                  New
                </button>
              )}
            </div>
          </div>

          {/* Body */}
          {listQuery.isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-hanover-green" />
            </div>
          ) : listQuery.isError ? (
            <div className="rounded border border-border bg-card p-6 shadow-sm">
              <p className="font-medium text-destructive">Could not load announcements.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {listQuery.error instanceof Error ? listQuery.error.message : "Unknown error"}
              </p>
            </div>
          ) : (
            <>
              {active.length === 0 ? (
                <div className="rounded-lg border border-border bg-card px-6 py-12 text-center shadow-sm">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <Megaphone className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground">No active announcements.</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    You're all caught up. New announcements from admins will appear here.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {active.map((item) => (
                    <AnnouncementCard key={item.id} item={item} onMarkRead={handleMarkRead} />
                  ))}
                </div>
              )}

              {archive.length > 0 && (
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => setShowArchive((v) => !v)}
                    className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform ${
                        showArchive ? "rotate-0" : "-rotate-90"
                      }`}
                    />
                    Archive ({archive.length})
                  </button>
                  {showArchive && (
                    <div className="mt-3 flex flex-col gap-3 opacity-75">
                      {archive.map((item) => (
                        <AnnouncementCard key={item.id} item={item} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <ComposeAnnouncementDialog open={showCompose} onClose={() => setShowCompose(false)} />
    </>
  );
}

export default AnnouncementsPage;
