import {
  contentIdSchema,
  contentListQuerySchema,
  createContentSchema,
  updateContentSchema,
} from "@myapp/types/schemas";
import type { Prisma } from "@prisma/client";
import { publicProcedure, router } from "../lib/trpc";

const ownerSelect = {
  id: true,
  name: true,
  employee_code: true,
  role: true,
} as const;

const checkedOutByUserSelect = {
  id: true,
  name: true,
} as const;

const tagsInclude = {
  content_tags: {
    include: {
      tag: true,
    },
  },
} as const;

function assertCanEdit(
  file: { is_checked_out: boolean; checked_out_by: string | null } | null,
  userId: string,
  userRole?: string | null,
) {
  if (!file) throw new Error("File not found");
  if (userRole === "admin") return;
  if (!file.is_checked_out || file.checked_out_by !== userId) {
    throw new Error("You must check out this item before modifying or deleting it");
  }
}

function normalizeRole(role?: string | null) {
  return (role ?? "").toLowerCase().replace(/\s+/g, "-").trim();
}

function canEditForRole(
  userRole: string | null | undefined,
  jobPosition: string | null | undefined,
): boolean {
  if (!userRole) return false;
  if (userRole === "admin") return true;
  if (!jobPosition?.trim()) return true;
  return normalizeRole(userRole) === normalizeRole(jobPosition);
}

export const contentRouter = router({
  checkout: publicProcedure.input(contentIdSchema).mutation(async ({ ctx, input }) => {
    const userId = ctx.user?.id;
    if (!userId) throw new Error("Not authenticated");

    const profile = ctx.profile as { role: string | null } | null;
    const userRole = profile?.role;

    const file = await ctx.prisma.contentManagement.findUnique({
      where: { fileID: input.fileID },
      select: { is_checked_out: true, checked_out_by: true, job_position: true },
    });
    if (!file) throw new Error("File not found");

    if (!canEditForRole(userRole, file.job_position)) {
      throw new Error("You do not have permission to edit this content");
    }

    const result = await ctx.prisma.contentManagement.updateMany({
      where: {
        fileID: input.fileID,
        OR: [{ is_checked_out: false }, { checked_out_by: userId }],
      },
      data: {
        is_checked_out: true,
        checked_out_by: userId,
        checked_out_at: new Date(),
      },
    });

    if (result.count === 0) {
      throw new Error("File is already checked out by someone else");
    }

    return { success: true };
  }),

  forceUnlock: publicProcedure.input(contentIdSchema).mutation(async ({ ctx, input }) => {
    const userId = ctx.user?.id;
    if (!userId) throw new Error("Not authenticated");

    const userRole = ctx.user?.role;
    if (userRole !== "admin") {
      throw new Error("Only admins can force unlock files");
    }

    const file = await ctx.prisma.contentManagement.findUnique({
      where: { fileID: input.fileID },
    });

    if (!file) throw new Error("File not found");

    return ctx.prisma.contentManagement.update({
      where: { fileID: input.fileID },
      data: {
        is_checked_out: false,
        checked_out_by: null,
        checked_out_at: null,
      },
    });
  }),

  checkin: publicProcedure.input(contentIdSchema).mutation(async ({ ctx, input }) => {
    const userId = ctx.user?.id;
    if (!userId) throw new Error("Not authenticated");

    const result = await ctx.prisma.contentManagement.updateMany({
      where: {
        fileID: input.fileID,
        checked_out_by: userId,
      },
      data: {
        is_checked_out: false,
        checked_out_by: null,
        checked_out_at: null,
      },
    });

    if (result.count === 0) {
      throw new Error("You don't own this checkout");
    }

    return { success: true };
  }),

  list: publicProcedure.input(contentListQuerySchema).query(async ({ ctx, input }) => {
    const where: Record<string, unknown> = {};

    if (input.document_status) {
      where.document_status = input.document_status;
    }

    if (input.content_type) {
      where.content_type = input.content_type;
    }

    if (input.owner_id) {
      where.owner_id = input.owner_id;
    }

    if (input.role && input.role !== "all") {
      const role = input.role.toLowerCase();

      where.job_position = {
        in: [
          role,
          role.toLowerCase(),
          role.replace(/-/g, " "),
          role.charAt(0).toUpperCase() + role.slice(1).replace(/-/g, " "),
        ],
      };
    }

    if (input.search) {
      where.OR = [
        { filename: { contains: input.search, mode: "insensitive" } },
        { url: { contains: input.search, mode: "insensitive" } },
      ];
    }

    if (input.tagIds && input.tagIds.length > 0) {
      const mode = input.tagMatchMode ?? "any";
      if (mode === "all") {
        where.AND = input.tagIds.map((id) => ({
          content_tags: { some: { tagId: id } },
        }));
      } else {
        where.content_tags = { some: { tagId: { in: input.tagIds } } };
      }
    }

    const results = await ctx.prisma.contentManagement.findMany({
      where,
      orderBy: [{ is_favorited: "desc" }, { last_modified: "desc" }],
      include: {
        owner: { select: ownerSelect },
        checked_out_by_user: { select: checkedOutByUserSelect },
        ...tagsInclude,
      },
    });

    if (input.pinnedTagId !== undefined) {
      const pinnedId = input.pinnedTagId;
      const pinned = results.filter((r) => r.content_tags.some((ct) => ct.tagId === pinnedId));
      const unpinned = results.filter((r) => !r.content_tags.some((ct) => ct.tagId === pinnedId));
      return [...pinned, ...unpinned];
    }

    return results;
  }),

  getById: publicProcedure.input(contentIdSchema).query(async ({ ctx, input }) => {
    return ctx.prisma.contentManagement.findUniqueOrThrow({
      where: { fileID: input.fileID },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            employee_code: true,
            job_desc: true,
          },
        },
        checked_out_by_user: { select: checkedOutByUserSelect },
        ...tagsInclude,
      },
    });
  }),

  create: publicProcedure.input(createContentSchema).mutation(async ({ ctx, input }) => {
    const userId = ctx.user?.id;
    if (!userId) throw new Error("Unauthorized");

    const { tagIds, owner_id, ...rest } = input;

    const data: Prisma.ContentManagementUncheckedCreateInput = {
      ...rest,
      owner_id: owner_id ?? null,
    };

    const result = await ctx.prisma.contentManagement.create({
      data:
        tagIds && tagIds.length > 0
          ? ({
              ...data,
              content_tags: { create: tagIds.map((id) => ({ tagId: id })) },
            } as Prisma.ContentManagementCreateInput)
          : data,
      include: {
        owner: { select: ownerSelect },
        checked_out_by_user: { select: checkedOutByUserSelect },
        ...tagsInclude,
      },
    });

    await ctx.prisma.auditEvent.create({
      data: {
        userId,
        action: "upload",
        documentId: result.fileID,
        fileName: result.filename,
      },
    });

    return result;
  }),

  update: publicProcedure
    .input(contentIdSchema.merge(updateContentSchema))
    .mutation(async ({ ctx, input }) => {
      const { fileID, tagIds, owner_id, ...data } = input;

      const userId = ctx.user?.id;
      if (!userId) throw new Error("Not authenticated");

      const profile = ctx.profile as { role: string | null } | null;
      const userRole = profile?.role;

      const file = await ctx.prisma.contentManagement.findUnique({
        where: { fileID },
      });

      assertCanEdit(file, userId, userRole);

      if (!canEditForRole(userRole, file?.job_position)) {
        throw new Error("You do not have permission to edit this content");
      }

      const result =
        tagIds !== undefined
          ? await ctx.prisma.contentManagement.update({
              where: { fileID },
              data: {
                ...data,
                owner_id,
                content_tags: {
                  deleteMany: {},
                  create: tagIds.map((id) => ({ tagId: id })),
                },
              } as Prisma.ContentManagementUpdateInput,
              include: {
                owner: { select: ownerSelect },
                checked_out_by_user: { select: checkedOutByUserSelect },
                ...tagsInclude,
              },
            })
          : await ctx.prisma.contentManagement.update({
              where: { fileID },
              data: {
                ...data,
                owner_id,
              } as Prisma.ContentManagementUncheckedUpdateInput,
              include: {
                owner: { select: ownerSelect },
                checked_out_by_user: { select: checkedOutByUserSelect },
                ...tagsInclude,
              },
            });

      await ctx.prisma.auditEvent.create({
        data: {
          userId,
          action: "edit",
          documentId: fileID,
          fileName: result.filename,
        },
      });

      return result;
    }),

  delete: publicProcedure.input(contentIdSchema).mutation(async ({ ctx, input }) => {
    const userId = ctx.user?.id;
    if (!userId) throw new Error("Not authenticated");

    const profile = ctx.profile as { role: string | null } | null;
    const userRole = profile?.role;

    const file = await ctx.prisma.contentManagement.findUnique({
      where: { fileID: input.fileID },
    });

    if (!file) throw new Error("File not found");
    assertCanEdit(file, userId, userRole);

    const result = await ctx.prisma.contentManagement.delete({
      where: { fileID: input.fileID },
    });

    await ctx.prisma.tag.deleteMany({
      where: { content_tags: { none: {} } },
    });

    await ctx.prisma.auditEvent.create({
      data: {
        userId,
        action: "delete",
        documentId: input.fileID,
      },
    });

    return result;
  }),
});
