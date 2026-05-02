import { z } from "zod";
import { adminPortalProcedure, protectedProcedure, router } from "../lib/trpc";

// ---------------------------------------------------------------------------
// Local types (Prisma loses row types when `where` is Record<string, unknown>)
// ---------------------------------------------------------------------------

type AuditChangeEventRow = {
  id: string;
  action: string;
  createdAt: Date;
  fileName: string | null;
  documentId: string | null;
  userId: string;
  user: { name: string } | null;
};

type AuditOwnershipEventRow = {
  id: string;
  createdAt: Date;
  fileName: string | null;
  documentId: string | null;
  metadata: unknown;
  user: { name: string } | null;
};

type AnnouncementRow = {
  id: string;
  title: string;
  body: string;
  urgency: string;
  publishedAt: Date;
  expiresAt: Date | null;
  author: { name: string } | null;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizeRole(role?: string | null) {
  return (role ?? "").toLowerCase().replace(/\s+/g, "-").trim();
}

function roleVariants(role?: string | null) {
  const normalized = normalizeRole(role);
  if (!normalized) return [];
  return [
    normalized,
    normalized.replace(/-/g, " "),
    normalized.charAt(0).toUpperCase() + normalized.slice(1).replace(/-/g, " "),
  ];
}

/** Map raw urgency string → our tier type */
function toUrgency(raw: string): "critical" | "high" | "warning" | "info" {
  if (raw === "critical") return "critical";
  if (raw === "high") return "high";
  if (raw === "warning") return "warning";
  return "info";
}

/**
 * Compute urgency tier from time-until-event (ms).
 *  past         → critical   (expired / overdue)
 *  ≤ 7 days     → high       (expiring this week)
 *  ≤ 15 days    → warning    (expiring soon)
 *  > 15 days    → info       (still in processing)
 */
function timeBasedUrgency(target: Date, now: number): "critical" | "high" | "warning" | "info" {
  const t = target.getTime();
  if (t < now) return "critical";
  const daysLeft = (t - now) / (24 * 60 * 60 * 1000);
  if (daysLeft <= 7) return "high";
  if (daysLeft <= 15) return "warning";
  return "info";
}

const COALESCE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

// ---------------------------------------------------------------------------
// Coalesce repeated edits by the same user on the same doc within 1 hour
// ---------------------------------------------------------------------------
function coalesceChangeEvents(events: AuditChangeEventRow[]): AuditChangeEventRow[] {
  const seen = new Map<string, AuditChangeEventRow>();
  const result: AuditChangeEventRow[] = [];

  for (const event of events) {
    const key = `${event.documentId ?? ""}:${event.userId}:${event.action}`;
    const existing = seen.get(key);
    if (
      existing &&
      Math.abs(existing.createdAt.getTime() - event.createdAt.getTime()) < COALESCE_WINDOW_MS
    ) {
      // Keep the latest timestamp; already in result array — update in place
      if (event.createdAt > existing.createdAt) {
        existing.createdAt = event.createdAt;
      }
      continue;
    }
    seen.set(key, event);
    result.push(event);
  }

  return result;
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const notificationsRouter = router({
  // -------------------------------------------------------------------------
  // myList — returns the activity feed for the current user. Activity feed
  // contains document change events and ownership transfers only.
  // Expirations / review dates → calendarEvents. Announcements → listAnnouncements.
  // -------------------------------------------------------------------------
  myList: protectedProcedure.query(async ({ ctx }) => {
    const profile = await ctx.prisma.userProfile.findUnique({
      where: { id: ctx.user.id },
      select: { role: true },
    });

    const isAdmin = profile?.role === "admin";
    const contentWhere: Record<string, unknown> = isAdmin
      ? {}
      : {
          OR: [{ job_position: null }, { job_position: { in: roleVariants(profile?.role) } }],
        };

    // Fetch content (for filename resolution), change events, and state in parallel.
    // Ownership events are fetched in a second step once we have content ids.
    const [content, rawChangeEvents, stateRows] = await Promise.all([
      ctx.prisma.contentManagement.findMany({
        where: contentWhere,
        select: {
          fileID: true,
          filename: true,
        },
        orderBy: { fileID: "asc" },
      }) as Promise<{ fileID: string; filename: string | null }[]>,

      ctx.prisma.auditEvent
        .findMany({
          where: {
            action: { in: ["upload", "edit"] },
            ...(isAdmin
              ? {}
              : {
                  documentId: {
                    in: await ctx.prisma.contentManagement
                      .findMany({ where: contentWhere, select: { fileID: true } })
                      .then((rows) => rows.map((r) => r.fileID)),
                  },
                }),
          },
          select: {
            id: true,
            action: true,
            createdAt: true,
            fileName: true,
            documentId: true,
            userId: true,
            user: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 200,
        })
        .then((rows) => rows as AuditChangeEventRow[]),

      ctx.prisma.notificationState.findMany({
        where: { userId: ctx.user.id },
        select: {
          notificationKey: true,
          readAt: true,
          pinnedAt: true,
          deletedAt: true,
        },
      }),
    ]);

    const byFileId = new Map(content.map((row) => [row.fileID, row]));
    const ids = content.map((row) => row.fileID);

    // Re-run ownership query with correct ids (two-step due to Promise.all ordering)
    const ownershipEventsFiltered: AuditOwnershipEventRow[] =
      ids.length === 0
        ? []
        : ((await ctx.prisma.auditEvent.findMany({
            where: { action: "ownership-update", documentId: { in: ids } },
            select: {
              id: true,
              createdAt: true,
              fileName: true,
              documentId: true,
              metadata: true,
              user: { select: { name: true } },
            },
            orderBy: { createdAt: "desc" },
            take: 100,
          })) as AuditOwnershipEventRow[]);

    // State lookup map
    const stateMap = new Map(stateRows.map((s) => [s.notificationKey, s]));

    // Suppress self-authored change events, then coalesce
    const changeEvents = coalesceChangeEvents(
      rawChangeEvents.filter((e) => e.userId !== ctx.user.id),
    );

    const rows = [
      // Document change events
      ...changeEvents.map((event) => {
        const docId = event.documentId ?? "";
        const fallbackName = docId ? byFileId.get(docId)?.filename : undefined;
        const key = `change-${event.id}`;
        const state = stateMap.get(key);
        return {
          id: key,
          type: "document-change" as const,
          urgency: "info" as const,
          createdAt: event.createdAt,
          fileID: docId,
          fileName: event.fileName ?? fallbackName ?? (docId || "Unknown document"),
          message: event.action === "upload" ? "New content was added." : "This item was updated.",
          actorName: event.user?.name ?? null,
          isRead: state?.readAt != null,
          isPinned: state?.pinnedAt != null,
          isDeleted: state?.deletedAt != null,
        };
      }),

      // Ownership change events
      ...ownershipEventsFiltered.map((event) => {
        const meta = (event.metadata ?? {}) as {
          oldOwnerName?: string | null;
          newOwnerName?: string | null;
        };
        const from = meta.oldOwnerName ?? "Unassigned";
        const to = meta.newOwnerName ?? "Unassigned";
        const key = `ownership-${event.id}`;
        const state = stateMap.get(key);
        return {
          id: key,
          type: "ownership-update" as const,
          urgency: "info" as const,
          createdAt: event.createdAt,
          fileID: event.documentId ?? "",
          fileName: event.fileName ?? event.documentId ?? "Unknown document",
          message: `Owner changed (${from} → ${to}).`,
          actorName: event.user?.name ?? null,
          isRead: state?.readAt != null,
          isPinned: state?.pinnedAt != null,
          isDeleted: state?.deletedAt != null,
        };
      }),
    ];

    const filtered = rows.filter((r) => !r.isDeleted);
    const sorted = filtered.sort((a, b) => {
      // Pinned items first, then by date desc
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    return {
      items: sorted.slice(0, 200),
      unreadCount: sorted.filter((r) => !r.isRead).length,
    };
  }),

  // -------------------------------------------------------------------------
  // calendarEvents — review dates + expirations within a date range, scoped
  // to the user's owned content ("mine") or their job role ("role").
  // -------------------------------------------------------------------------
  calendarEvents: protectedProcedure
    .input(
      z.object({
        scope: z.enum(["mine", "role"]),
        start: z.coerce.date(),
        end: z.coerce.date(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const profile = await ctx.prisma.userProfile.findUnique({
        where: { id: ctx.user.id },
        select: { role: true },
      });
      const isAdmin = profile?.role === "admin";

      const ownedClause = { owner_id: ctx.user.id };
      const roleClause: Record<string, unknown> = isAdmin
        ? {}
        : { OR: [{ job_position: null }, { job_position: { in: roleVariants(profile?.role) } }] };

      const where: Record<string, unknown> =
        input.scope === "mine" ? ownedClause : isAdmin ? {} : { OR: [ownedClause, roleClause] };

      const content = (await ctx.prisma.contentManagement.findMany({
        where,
        select: {
          fileID: true,
          filename: true,
          owner_id: true,
          job_position: true,
          expiration_date: true,
          next_review_date: true,
        },
        orderBy: { fileID: "asc" },
      })) as Array<{
        fileID: string;
        filename: string | null;
        owner_id: string | null;
        job_position: string | null;
        expiration_date: Date | null;
        next_review_date: Date | null;
      }>;

      const startMs = input.start.getTime();
      const endMs = input.end.getTime();
      const now = Date.now();

      type CalendarEvent = {
        id: string;
        kind: "review" | "expiration";
        date: Date;
        fileID: string;
        fileName: string;
        ownership: "mine" | "role";
        urgency: "critical" | "high" | "warning" | "info";
      };

      const events: CalendarEvent[] = [];

      for (const row of content) {
        const isMine = row.owner_id === ctx.user.id;
        const ownership = isMine ? "mine" : "role";
        const fileName = row.filename ?? row.fileID;

        if (
          row.next_review_date &&
          row.next_review_date.getTime() >= startMs &&
          row.next_review_date.getTime() <= endMs
        ) {
          events.push({
            id: `review-${row.fileID}`,
            kind: "review",
            date: row.next_review_date,
            fileID: row.fileID,
            fileName,
            ownership,
            urgency: timeBasedUrgency(row.next_review_date, now),
          });
        }

        if (
          row.expiration_date &&
          row.expiration_date.getTime() >= startMs &&
          row.expiration_date.getTime() <= endMs
        ) {
          events.push({
            id: `expiration-${row.fileID}`,
            kind: "expiration",
            date: row.expiration_date,
            fileID: row.fileID,
            fileName,
            ownership,
            urgency: timeBasedUrgency(row.expiration_date, now),
          });
        }
      }

      events.sort((a, b) => a.date.getTime() - b.date.getTime());
      return events;
    }),

  // -------------------------------------------------------------------------
  // listAnnouncements — announcements visible to the current user, with
  // per-user read state. Splits into active (non-expired) and archived.
  // -------------------------------------------------------------------------
  listAnnouncements: protectedProcedure.query(async ({ ctx }) => {
    const profile = await ctx.prisma.userProfile.findUnique({
      where: { id: ctx.user.id },
      select: { role: true },
    });

    const announcementsRaw = (await ctx.prisma.announcement.findMany({
      where: {
        OR: [{ audience: "all" }, { audience: "roles" }],
      },
      select: {
        id: true,
        title: true,
        body: true,
        urgency: true,
        audience: true,
        targetRoles: true,
        publishedAt: true,
        expiresAt: true,
        author: { select: { name: true } },
      },
      orderBy: { publishedAt: "desc" },
    })) as (AnnouncementRow & { audience: string; targetRoles: string[] })[];

    const userRole = profile?.role ?? "";
    const visible = announcementsRaw.filter((a) => {
      if (a.audience === "all") return true;
      if (a.audience === "roles") {
        return roleVariants(userRole).some((v) => a.targetRoles.includes(v));
      }
      return false;
    });

    const stateRows = await ctx.prisma.notificationState.findMany({
      where: { userId: ctx.user.id },
      select: { notificationKey: true, readAt: true },
    });
    const stateMap = new Map(stateRows.map((s) => [s.notificationKey, s]));

    const now = Date.now();
    const items = visible.map((a) => {
      const key = `announcement-${a.id}`;
      const state = stateMap.get(key);
      const isExpired = a.expiresAt != null && a.expiresAt.getTime() <= now;
      return {
        id: key,
        announcementId: a.id,
        title: a.title,
        body: a.body,
        urgency: toUrgency(a.urgency),
        audience: a.audience,
        targetRoles: a.targetRoles,
        publishedAt: a.publishedAt,
        expiresAt: a.expiresAt,
        authorName: a.author?.name ?? null,
        isRead: state?.readAt != null,
        isExpired,
      };
    });

    const active = items.filter((i) => !i.isExpired);
    const archive = items.filter((i) => i.isExpired);

    return {
      active,
      archive,
      unreadCount: active.filter((i) => !i.isRead).length,
    };
  }),

  // -------------------------------------------------------------------------
  // setRead — mark keys as read or unread
  // -------------------------------------------------------------------------
  setRead: protectedProcedure
    .input(
      z.object({
        keys: z.array(z.string().min(1)).min(1).max(500),
        read: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const now = new Date();
      await Promise.all(
        input.keys.map((key) =>
          ctx.prisma.notificationState.upsert({
            where: { userId_notificationKey: { userId: ctx.user.id, notificationKey: key } },
            create: {
              userId: ctx.user.id,
              notificationKey: key,
              readAt: input.read ? now : null,
            },
            update: { readAt: input.read ? now : null },
          }),
        ),
      );

      return { success: true };
    }),

  // -------------------------------------------------------------------------
  // setPinned — pin or unpin notifications
  // -------------------------------------------------------------------------
  setPinned: protectedProcedure
    .input(
      z.object({
        keys: z.array(z.string().min(1)).min(1).max(500),
        pinned: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const now = new Date();
      await Promise.all(
        input.keys.map((key) =>
          ctx.prisma.notificationState.upsert({
            where: { userId_notificationKey: { userId: ctx.user.id, notificationKey: key } },
            create: {
              userId: ctx.user.id,
              notificationKey: key,
              pinnedAt: input.pinned ? now : null,
            },
            update: { pinnedAt: input.pinned ? now : null },
          }),
        ),
      );
      return { success: true };
    }),

  // -------------------------------------------------------------------------
  // delete — soft-delete notifications
  // -------------------------------------------------------------------------
  delete: protectedProcedure
    .input(z.object({ keys: z.array(z.string().min(1)).min(1).max(500) }))
    .mutation(async ({ ctx, input }) => {
      const now = new Date();
      await Promise.all(
        input.keys.map((key) =>
          ctx.prisma.notificationState.upsert({
            where: { userId_notificationKey: { userId: ctx.user.id, notificationKey: key } },
            create: { userId: ctx.user.id, notificationKey: key, deletedAt: now },
            update: { deletedAt: now },
          }),
        ),
      );
      return { success: true };
    }),

  // -------------------------------------------------------------------------
  // adminList — admin-only: fetch all announcements
  // -------------------------------------------------------------------------
  adminListAnnouncements: adminPortalProcedure.query(async ({ ctx }) => {
    return ctx.prisma.announcement.findMany({
      orderBy: { publishedAt: "desc" },
      select: {
        id: true,
        title: true,
        body: true,
        urgency: true,
        audience: true,
        targetRoles: true,
        publishedAt: true,
        expiresAt: true,
        author: { select: { id: true, name: true } },
      },
    });
  }),

  // -------------------------------------------------------------------------
  // createAnnouncement — admin only
  // -------------------------------------------------------------------------
  createAnnouncement: adminPortalProcedure
    .input(
      z.object({
        title: z.string().min(1).max(200),
        body: z.string().min(1),
        urgency: z.enum(["info", "warning", "high", "critical"]).default("info"),
        audience: z.enum(["all", "roles"]).default("all"),
        targetRoles: z.array(z.string()).default([]),
        expiresAt: z.coerce.date().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.announcement.create({
        data: {
          authorId: ctx.user.id,
          title: input.title,
          body: input.body,
          urgency: input.urgency,
          audience: input.audience,
          targetRoles: input.targetRoles,
          expiresAt: input.expiresAt ?? null,
        },
      });
    }),

  // -------------------------------------------------------------------------
  // updateAnnouncement — admin only
  // -------------------------------------------------------------------------
  updateAnnouncement: adminPortalProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).max(200).optional(),
        body: z.string().min(1).optional(),
        urgency: z.enum(["info", "warning", "high", "critical"]).optional(),
        audience: z.enum(["all", "roles"]).optional(),
        targetRoles: z.array(z.string()).optional(),
        expiresAt: z.coerce.date().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.prisma.announcement.update({
        where: { id },
        data,
      });
    }),

  // -------------------------------------------------------------------------
  // deleteAnnouncement — admin only
  // -------------------------------------------------------------------------
  deleteAnnouncement: adminPortalProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.announcement.delete({ where: { id: input.id } });
      return { success: true };
    }),
});
