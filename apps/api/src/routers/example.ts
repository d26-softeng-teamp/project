import { router, publicProcedure } from "../lib/trpc";
import { logAudit } from "../utils/audit";

export const exampleRouter = router({
    testAudit: publicProcedure.query(async ({ ctx }) => {
        await logAudit("TEST_ACTION", ctx.user.id);
        return { message: "Audit logged successfully" };
    }),
});