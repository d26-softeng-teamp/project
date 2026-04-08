// apps/api/src/routers/example.ts
import { router, publicProcedure } from "../lib/trpc";
import { logAudit } from "../utils/audit";

export const exampleRouter = router({
    testAudit: publicProcedure.query(async ({ ctx }) => {
        //Make sure we have a user
        if (!ctx.user) {
            return { message: "No user authenticated, audit skipped" };
        }

        try {
            //DEVELOPMENT MODE: skip actual database audit
            //Run: $env:NODE_ENV="development" in console before pnpm run dev
            if (process.env.NODE_ENV === "development") {
                console.log(`DEV MODE: Fake audit logged for user ${ctx.user.id}`);
                return { message: "Audit logged successfully (dev)" };
            }

            //PRODUCTION: call the real logAudit function
            await logAudit("TEST_ACTION", ctx.user.id);
            return { message: "Audit logged successfully" };
        } catch (error) {
            console.error("Failed to log audit:", error);
            return { message: "Audit failed", error: (error as Error).message };
        }
    }),
});