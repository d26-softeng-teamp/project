import { accountPortalFromUserMetadata, loginWithPortalSchema } from "@myapp/types/schemas";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "../lib/trpc";

export const loginRouter = router({
  login: publicProcedure.input(loginWithPortalSchema).mutation(async ({ ctx, input }) => {
    const { portal: _portal, ...creds } = input;
    const { data, error } = await ctx.supabase.auth.signInWithPassword(creds);
    if (error) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
    const user = data.user ?? data.session?.user;
    if (!user) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Sign-in returned no user." });
    }
    const profile = await ctx.prisma.userProfile.findUnique({
      where: { id: user.id },
      select: { portal: true, role: true },
    });
    const assigned =
      profile?.portal ??
      accountPortalFromUserMetadata(user.user_metadata as Record<string, unknown>);
    if (assigned !== "employee" && assigned !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "This account is not enabled to sign in.",
      });
    }
    return { session: data.session, role: profile?.role ?? "underwriter" };
  }),
});
