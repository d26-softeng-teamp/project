import {
  contentIdSchema,
  contentListQuerySchema,
  createContentSchema,
  updateContentSchema,
} from "@myapp/types/schemas";
import { publicProcedure, router } from "../lib/trpc";

export const contentRouter = router({
  list: publicProcedure.input(contentListQuerySchema).query(async ({ ctx, input }) => {
    const where: Record<string, unknown> = {};

    if (input.document_status) {
      where.document_status = input.document_status;
    }

    if (input.content_owner) {
      where.content_owner = input.content_owner;
    }

    if (input.job_position) {
      where.job_position = input.job_position;
    }

    if (input.search) {
      where.OR = [
        { filename: { contains: input.search, mode: "insensitive" } },
        { url: { contains: input.search, mode: "insensitive" } },
      ];
    }

    return ctx.prisma.contentManagement.findMany({
      where,
      orderBy: { last_modified: "desc" },
      include: {
        employee: {
          select: {
            employeeID: true,
            employee_name: true,
          },
        },
      },
    });
  }),

  getById: publicProcedure.input(contentIdSchema).query(async ({ ctx, input }) => {
    return ctx.prisma.contentManagement.findUniqueOrThrow({
      where: { fileID: input.fileID },
      include: {
        employee: {
          select: {
            employeeID: true,
            employee_name: true,
            job_desc: true,
          },
        },
      },
    });
  }),

  create: publicProcedure.input(createContentSchema).mutation(async ({ ctx, input }) => {
    return ctx.prisma.contentManagement.create({
      data: input,
      include: {
        employee: {
          select: { employeeID: true, employee_name: true },
        },
      },
    });
  }),

  update: publicProcedure
    .input(contentIdSchema.merge(updateContentSchema))
    .mutation(async ({ ctx, input }) => {
      const { fileID, ...data } = input;
      return ctx.prisma.contentManagement.update({
        where: { fileID },
        data,
        include: {
          employee: {
            select: { employeeID: true, employee_name: true },
          },
        },
      });
    }),

  delete: publicProcedure.input(contentIdSchema).mutation(async ({ ctx, input }) => {
    return ctx.prisma.contentManagement.delete({ where: { fileID: input.fileID } });
  }),
});
