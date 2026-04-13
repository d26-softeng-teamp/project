import {
  adminCreateUserSchema,
  adminUpdateUserSchema,
  adminUserListQuerySchema,
  profileNameSchema,
  userIdSchema,
} from "@myapp/types/schemas";
import { TRPCError } from "@trpc/server";
import { createSupabaseAdmin } from "../lib/supabase";
import { adminPortalProcedure, protectedProcedure, router } from "../lib/trpc";

type AdminProfilePatch = {
  email?: string;
  password?: string;
  name?: string;
  portal?: string;
  role?: string;
  employee_code?: string | null;
  job_desc?: string | null;
};

async function applyAdminAuthCredentialUpdates(
  admin: ReturnType<typeof createSupabaseAdmin>,
  userId: string,
  email: string | undefined,
  password: string | undefined,
) {
  if (email === undefined && password === undefined) return;
  const creds: { email?: string; password?: string } = {};
  if (email !== undefined) creds.email = email;
  if (password !== undefined) creds.password = password;
  const { error } = await admin.auth.admin.updateUserById(userId, creds);
  if (error) {
    throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
  }
}

function buildProfileUpdateData(patch: AdminProfilePatch) {
  const data: {
    email?: string;
    name?: string;
    portal?: string;
    role?: string;
    employee_code?: string | null;
    job_desc?: string | null;
  } = {};
  if (patch.email !== undefined) data.email = patch.email;
  if (patch.name !== undefined) data.name = patch.name;
  if (patch.portal !== undefined) data.portal = patch.portal;
  if (patch.role !== undefined) data.role = patch.role;
  if (patch.employee_code !== undefined) data.employee_code = patch.employee_code;
  if (patch.job_desc !== undefined) data.job_desc = patch.job_desc;
  return data;
}

export const userRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    return ctx.user;
  }),

  /** Authoritative portal + role for route guards (from `public.users`). */
  myAccess: protectedProcedure.query(async ({ ctx }) => {
    const profile = await ctx.prisma.userProfile.findUnique({
      where: { id: ctx.user.id },
      select: { portal: true, role: true },
    });
    if (!profile) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Profile not found." });
    }
    return profile;
  }),

  myProfile: protectedProcedure.query(async ({ ctx }) => {
    const row = await ctx.prisma.userProfile.findUnique({
      where: { id: ctx.user.id },
    });
    if (!row) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Profile not found." });
    }
    return row;
  }),

  updateMyProfile: protectedProcedure.input(profileNameSchema).mutation(async ({ ctx, input }) => {
    await ctx.prisma.userProfile.update({
      where: { id: ctx.user.id },
      data: { name: input.name },
    });
    const row = await ctx.prisma.userProfile.findUniqueOrThrow({ where: { id: ctx.user.id } });
    const admin = createSupabaseAdmin();
    const { error: metaErr } = await admin.auth.admin.updateUserById(ctx.user.id, {
      user_metadata: {
        name: row.name,
        portal: row.portal,
        role: row.role,
        employee_code: row.employee_code,
        job_desc: row.job_desc,
      },
    });
    if (metaErr) {
      console.warn("[user] updateMyProfile metadata sync:", metaErr.message);
    }
    return row;
  }),

  adminList: adminPortalProcedure.input(adminUserListQuerySchema).query(async ({ ctx, input }) => {
    const where =
      input.search && input.search.trim() !== ""
        ? {
            OR: [
              { email: { contains: input.search, mode: "insensitive" as const } },
              { name: { contains: input.search, mode: "insensitive" as const } },
              { role: { contains: input.search, mode: "insensitive" as const } },
              { employee_code: { contains: input.search, mode: "insensitive" as const } },
            ],
          }
        : undefined;

    return ctx.prisma.userProfile.findMany({
      where,
      orderBy: { created_at: "desc" },
    });
  }),

  adminGetById: adminPortalProcedure.input(userIdSchema).query(async ({ ctx, input }) => {
    return ctx.prisma.userProfile.findUniqueOrThrow({ where: { id: input.id } });
  }),

  adminCreate: adminPortalProcedure
    .input(adminCreateUserSchema)
    .mutation(async ({ ctx, input }) => {
      const admin = createSupabaseAdmin();
      const { employee_code, job_desc, ...rest } = input;
      const { data, error } = await admin.auth.admin.createUser({
        email: rest.email,
        password: rest.password,
        email_confirm: true,
        user_metadata: {
          name: rest.name,
          portal: rest.portal,
          role: rest.role,
          ...(employee_code ? { employee_code } : {}),
          ...(job_desc ? { job_desc } : {}),
        },
      });
      if (error || !data.user) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error?.message ?? "Failed to create auth user.",
        });
      }

      const userId = data.user.id;
      const profileData = {
        email: rest.email,
        name: rest.name,
        portal: rest.portal,
        role: rest.role,
        employee_code: employee_code ?? null,
        job_desc: job_desc ?? null,
      };

      // Supabase trigger `handle_new_user` normally inserts `public.users`. If prod DB is missing that
      // migration, findUnique would 500 — upsert keeps admin create working either way.
      return ctx.prisma.userProfile.upsert({
        where: { id: userId },
        create: { id: userId, ...profileData },
        update: profileData,
      });
    }),

  adminUpdate: adminPortalProcedure
    .input(userIdSchema.merge(adminUpdateUserSchema))
    .mutation(async ({ ctx, input }) => {
      const { id, ...patch } = input;
      const admin = createSupabaseAdmin();

      await applyAdminAuthCredentialUpdates(admin, id, patch.email, patch.password);

      const data = buildProfileUpdateData(patch);
      if (Object.keys(data).length > 0) {
        await ctx.prisma.userProfile.update({ where: { id }, data });
      }

      const row = await ctx.prisma.userProfile.findUniqueOrThrow({ where: { id } });
      const { error: metaErr } = await admin.auth.admin.updateUserById(id, {
        user_metadata: {
          name: row.name,
          portal: row.portal,
          role: row.role,
          employee_code: row.employee_code,
          job_desc: row.job_desc,
        },
      });
      if (metaErr) {
        console.warn("[user] adminUpdate metadata sync:", metaErr.message);
      }

      return row;
    }),

  adminDelete: adminPortalProcedure.input(userIdSchema).mutation(async ({ input }) => {
    const admin = createSupabaseAdmin();
    const { error } = await admin.auth.admin.deleteUser(input.id);
    if (error) {
      throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
    }
    return true;
  }),
});
