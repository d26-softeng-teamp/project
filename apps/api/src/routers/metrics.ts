import { z } from "zod";
import { adminPortalProcedure, router } from "../lib/trpc";

const rangeSchema = z.enum(["hour", "day", "week"]);

export const metricsRouter = router({
  /**
   * OVERVIEW
   */
  getOverview: adminPortalProcedure.query(async ({ ctx }) => {
    const [totalRequests, errors, activeUsers] = await Promise.all([
      ctx.prisma.metricsEvent.count(),
      ctx.prisma.metricsEvent.count({
        where: { status: "ERROR" },
      }),
      ctx.prisma.metricsEvent.findMany({
        select: { userId: true },
        distinct: ["userId"],
      }),
    ]);

    const errorRate = totalRequests === 0 ? 0 : errors / totalRequests;

    return {
      totalRequests,
      errors,
      activeUsers: activeUsers.length,
      errorRate,
    };
  }),

  getRequestsOverTime: adminPortalProcedure
    .input(z.object({ range: rangeSchema }).default({ range: "hour" }))
    .query(async ({ ctx, input }) => {
      const now = Date.now();

      const config = {
        hour: { bucketCount: 60, bucketMs: 60 * 1000 },
        day: { bucketCount: 24, bucketMs: 60 * 60 * 1000 },
        week: { bucketCount: 7, bucketMs: 24 * 60 * 60 * 1000 },
      }[input.range];

      const since = new Date(now - config.bucketCount * config.bucketMs);

      const events = await ctx.prisma.metricsEvent.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true },
      });

      const floorToBucket = (d: Date) => {
        const copy = new Date(d);
        if (input.range === "hour") {
          copy.setSeconds(0, 0);
        } else if (input.range === "day") {
          copy.setMinutes(0, 0, 0);
        } else {
          copy.setHours(0, 0, 0, 0);
        }
        return copy.getTime();
      };

      const formatLabel = (d: Date) => {
        if (input.range === "hour") {
          return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
        }
        if (input.range === "day") {
          return `${String(d.getHours()).padStart(2, "0")}:00`;
        }
        return d.toLocaleDateString(undefined, { weekday: "short" });
      };

      const buckets: { name: string; value: number; timestamp: number }[] = [];
      for (let i = config.bucketCount - 1; i >= 0; i--) {
        const start = new Date(floorToBucket(new Date(now - i * config.bucketMs)));
        buckets.push({ name: formatLabel(start), value: 0, timestamp: start.getTime() });
      }

      for (const e of events) {
        const ts = floorToBucket(e.createdAt);
        const bucket = buckets.find((b) => b.timestamp === ts);
        if (bucket) bucket.value += 1;
      }

      return buckets.map(({ name, value }) => ({ name, value }));
    }),

  /**
   * RECENT ACTIVITY
   */
  getRecent: adminPortalProcedure.query(async ({ ctx }) => {
    return ctx.prisma.metricsEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }),

  /**
   * SLOW ROUTES (optimized grouping)
   */
  getSlowestRoutes: adminPortalProcedure.query(async ({ ctx }) => {
    const data = await ctx.prisma.metricsEvent.findMany({
      select: {
        route: true,
        durationMs: true,
      },
    });

    const grouped = new Map<string, { total: number; count: number }>();

    for (const d of data) {
      if (!grouped.has(d.route)) {
        grouped.set(d.route, { total: 0, count: 0 });
      }

      const entry = grouped.get(d.route)!;
      entry.total += d.durationMs;
      entry.count += 1;
    }

    return Array.from(grouped.entries()).map(([route, v]) => ({
      route,
      avgDuration: v.total / v.count,
    }));
  }),

  getActiveUsers: adminPortalProcedure.query(async ({ ctx }) => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);

    return ctx.prisma.userSession.findMany({
      where: {
        lastSeen: { gte: fiveMinAgo },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    });
  }),

  getPerformance: adminPortalProcedure.query(async ({ ctx }) => {
    const data = await ctx.prisma.metricsEvent.findMany();

    const grouped = new Map<string, number[]>();

    for (const d of data) {
      if (!grouped.has(d.route)) grouped.set(d.route, []);
      grouped.get(d.route)!.push(d.durationMs);
    }

    return Array.from(grouped.entries()).map(([route, times]) => ({
      route,
      avgDuration: times.reduce((a, b) => a + b, 0) / times.length,
    }));
  }),
});
