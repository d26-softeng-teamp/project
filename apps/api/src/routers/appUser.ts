import {
  appUserIdSchema,
  appUserListQuerySchema,
  createAppUserSchema,
  updateAppUserSchema,
} from "@myapp/types/schemas";
import { publicProcedure, router } from "../lib/trpc";

export const appUserRouter = router({
  list: publicProcedure.input(appUserListQuerySchema).query(async ({ ctx, input }) => {
    const where: Record<string, unknown> = {};

    if (input.search) {
      where.OR = [
        { username: { contains: input.search, mode: "insensitive" } },
        { display_name: { contains: input.search, mode: "insensitive" } },
        { role: { contains: input.search, mode: "insensitive" } },
      ];
    }

    return ctx.prisma.appUser.findMany({
      where,
      orderBy: { created_at: "desc" },
    });
  }),

  getById: publicProcedure.input(appUserIdSchema).query(async ({ ctx, input }) => {
    return ctx.prisma.appUser.findUniqueOrThrow({ where: { id: input.id } });
  }),

  create: publicProcedure.input(createAppUserSchema).mutation(async ({ ctx, input }) => {
    return ctx.prisma.appUser.create({ data: input });
  }),

  update: publicProcedure
    .input(appUserIdSchema.merge(updateAppUserSchema))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.prisma.appUser.update({ where: { id }, data });
    }),

  delete: publicProcedure.input(appUserIdSchema).mutation(async ({ ctx, input }) => {
    return ctx.prisma.appUser.delete({ where: { id: input.id } });
  }),
});
