import { adminPortalProcedure, router } from "../lib/trpc";

const knownActivityActions = [
  "upload",
  "view",
  "download",
  "edit",
  "delete",
  "ownership-update",
] as const;

type ActivityAction = (typeof knownActivityActions)[number];

type ActivityCounts = Record<ActivityAction, number> & { other: number };

type ActivityOwner = {
  id: string;
  name: string;
  employee_code: string | null;
  role: string;
} | null;

function blankActivityCounts(): ActivityCounts {
  return {
    upload: 0,
    view: 0,
    download: 0,
    edit: 0,
    delete: 0,
    "ownership-update": 0,
    other: 0,
  };
}

function incrementActivity(counts: ActivityCounts, action: string) {
  if (knownActivityActions.includes(action as ActivityAction)) {
    counts[action as ActivityAction] += 1;
    return;
  }

  counts.other += 1;
}

function roleLabel(...roles: Array<string | null | undefined>) {
  for (const role of roles) {
    const normalized = role?.trim();
    if (normalized) return normalized;
  }

  return "unassigned";
}

function ownerKey(owner: ActivityOwner) {
  return owner?.id ?? "unassigned";
}

export const auditRouter = router({
  getRecent: adminPortalProcedure.query(async ({ ctx }) => {
    return ctx.prisma.auditEvent.findMany({
      select: {
        id: true,
        action: true,
        fileName: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            employee_code: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }),

  getSummary: adminPortalProcedure.query(async ({ ctx }) => {
    const [uploads, views, downloads, edits, deletes] = await Promise.all([
      ctx.prisma.auditEvent.count({ where: { action: "upload" } }),
      ctx.prisma.auditEvent.count({ where: { action: "view" } }),
      ctx.prisma.auditEvent.count({ where: { action: "download" } }),
      ctx.prisma.auditEvent.count({ where: { action: "edit" } }),
      ctx.prisma.auditEvent.count({ where: { action: "delete" } }),
    ]);

    return { uploads, views, downloads, edits, deletes };
  }),

  getTopUsers: adminPortalProcedure.query(async ({ ctx }) => {
    const events = await ctx.prisma.auditEvent.findMany({
      select: { userId: true },
    });

    const map = new Map<string, number>();

    for (const e of events) {
      map.set(e.userId, (map.get(e.userId) ?? 0) + 1);
    }

    return Array.from(map.entries()).map(([userId, count]) => ({
      userId,
      count,
    }));
  }),

  /**
   * DOCUMENT ACTIVITY REPORT
   *
   * Audit transactions grouped by document owner and role bucket. Role uses the
   * document's `job_position`, then owner role, then actor role as a fallback.
   */
  getDocumentActivityReport: adminPortalProcedure.query(async ({ ctx }) => {
    const events = await ctx.prisma.auditEvent.findMany({
      select: {
        id: true,
        action: true,
        documentId: true,
        fileName: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            employee_code: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const documentIds = Array.from(
      new Set(events.map((event) => event.documentId).filter((id): id is string => Boolean(id))),
    );

    const documents =
      documentIds.length > 0
        ? await ctx.prisma.contentManagement.findMany({
            where: { fileID: { in: documentIds } },
            select: {
              fileID: true,
              filename: true,
              view_count: true,
              last_viewed_at: true,
              job_position: true,
              owner: {
                select: {
                  id: true,
                  name: true,
                  employee_code: true,
                  role: true,
                },
              },
            },
          })
        : [];

    const documentById = new Map(documents.map((document) => [document.fileID, document]));
    const byOwnerRole = new Map<
      string,
      {
        owner: ActivityOwner;
        role: string;
        total: number;
        actions: ActivityCounts;
        documentIds: Set<string>;
        actorRoles: Record<string, number>;
        lastActivityAt: Date | null;
      }
    >();
    const byRole = new Map<
      string,
      {
        role: string;
        total: number;
        actions: ActivityCounts;
        ownerIds: Set<string>;
        documentIds: Set<string>;
        actorRoles: Record<string, number>;
        lastActivityAt: Date | null;
      }
    >();

    for (const event of events) {
      const document = event.documentId ? documentById.get(event.documentId) : undefined;
      const owner = document?.owner ?? null;
      const role = roleLabel(document?.job_position, owner?.role, event.user.role);
      const key = `${ownerKey(owner)}:${role}`;
      const actorRole = roleLabel(event.user.role);

      if (!byOwnerRole.has(key)) {
        byOwnerRole.set(key, {
          owner,
          role,
          total: 0,
          actions: blankActivityCounts(),
          documentIds: new Set<string>(),
          actorRoles: {},
          lastActivityAt: null,
        });
      }

      const ownerEntry = byOwnerRole.get(key)!;
      ownerEntry.total += 1;
      incrementActivity(ownerEntry.actions, event.action);
      if (event.documentId) ownerEntry.documentIds.add(event.documentId);
      ownerEntry.actorRoles[actorRole] = (ownerEntry.actorRoles[actorRole] ?? 0) + 1;
      if (!ownerEntry.lastActivityAt || event.createdAt > ownerEntry.lastActivityAt) {
        ownerEntry.lastActivityAt = event.createdAt;
      }

      if (!byRole.has(role)) {
        byRole.set(role, {
          role,
          total: 0,
          actions: blankActivityCounts(),
          ownerIds: new Set<string>(),
          documentIds: new Set<string>(),
          actorRoles: {},
          lastActivityAt: null,
        });
      }

      const roleEntry = byRole.get(role)!;
      roleEntry.total += 1;
      incrementActivity(roleEntry.actions, event.action);
      roleEntry.ownerIds.add(ownerKey(owner));
      if (event.documentId) roleEntry.documentIds.add(event.documentId);
      roleEntry.actorRoles[actorRole] = (roleEntry.actorRoles[actorRole] ?? 0) + 1;
      if (!roleEntry.lastActivityAt || event.createdAt > roleEntry.lastActivityAt) {
        roleEntry.lastActivityAt = event.createdAt;
      }
    }

    const totals = {
      transactions: events.length,
      documents: documentIds.length,
      actions: blankActivityCounts(),
      views: documents.reduce((sum, document) => sum + document.view_count, 0),
    };

    for (const event of events) {
      incrementActivity(totals.actions, event.action);
    }

    return {
      generatedAt: new Date(),
      totals,
      byOwner: Array.from(byOwnerRole.values())
        .map((entry) => ({
          owner: entry.owner,
          role: entry.role,
          total: entry.total,
          actions: entry.actions,
          documents: entry.documentIds.size,
          actorRoles: entry.actorRoles,
          lastActivityAt: entry.lastActivityAt,
        }))
        .sort((a, b) => b.total - a.total),
      byRole: Array.from(byRole.values())
        .map((entry) => ({
          role: entry.role,
          total: entry.total,
          actions: entry.actions,
          owners: entry.ownerIds.size,
          documents: entry.documentIds.size,
          actorRoles: entry.actorRoles,
          lastActivityAt: entry.lastActivityAt,
        }))
        .sort((a, b) => b.total - a.total),
      recent: events.slice(0, 25).map((event) => {
        const document = event.documentId ? documentById.get(event.documentId) : undefined;
        const owner = document?.owner ?? null;

        return {
          id: event.id,
          action: event.action,
          documentId: event.documentId,
          fileName: event.fileName ?? document?.filename ?? null,
          createdAt: event.createdAt,
          owner,
          role: roleLabel(document?.job_position, owner?.role, event.user.role),
          documentViewCount: document?.view_count ?? null,
          documentLastViewedAt: document?.last_viewed_at ?? null,
          actor: event.user,
        };
      }),
    };
  }),
});
