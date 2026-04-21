import { createTagSchema, tagIdSchema } from "@myapp/types/schemas";
import { z } from "zod";
import { publicProcedure, router } from "../lib/trpc";

export const tagRouter = router({
  // List all tags in the global pool
  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.tag.findMany({
      orderBy: { name: "asc" },
    });
  }),

  // Create a new tag — returns existing tag if name already exists
  create: publicProcedure.input(createTagSchema).mutation(async ({ ctx, input }) => {
    return ctx.prisma.tag.upsert({
      where: { name: input.name },
      update: {},
      create: {
        name: input.name,
        color: input.color ?? "#22c55e", //default fallback
      },
    });
  }),

  delete: publicProcedure.input(tagIdSchema).mutation(async ({ ctx, input }) => {
    const usageCount = await ctx.prisma.contentTag.count({
      where: { tagId: input.id },
    });

    if (usageCount > 0) {
      throw new Error("Cannot delete tag in use");
    }

    return ctx.prisma.tag.delete({
      where: { id: input.id },
    });
  }),

  update: publicProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string(),
        color: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // check name uniqueness
      const nameExists = await ctx.prisma.tag.findFirst({
        where: {
          name: input.name,
          NOT: { id: input.id },
        },
      });

      if (nameExists) {
        throw new Error("Tag name already in use");
      }

      // check color uniqueness
      const colorExists = await ctx.prisma.tag.findFirst({
        where: {
          color: input.color,
          NOT: { id: input.id },
        },
      });

      if (colorExists) {
        throw new Error("Tag color already in use");
      }

      return ctx.prisma.tag.update({
        where: { id: input.id },
        data: {
          name: input.name,
          color: input.color,
        },
      });
    }),
});
