import { z } from "zod";

export const userPortalSchema = z.enum(["employee", "admin"]);

export const accountRoleSchema = z.enum([
  "admin",
  "underwriter",
  "business-analyst",
  "actuarial-analyst",
  "exl-operations",
]);

export const userIdSchema = z.object({
  id: z.string().uuid(),
});

export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(255),
});

export const updateUserSchema = createUserSchema.partial();

/** Update signed-in user's display name in `public.users`. */
export const profileNameSchema = z.object({
  name: z.string().min(1).max(255),
});

export const adminUserListQuerySchema = z.object({
  search: z.string().optional(),
});

export const adminCreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(255),
  portal: userPortalSchema,
  role: accountRoleSchema,
  employee_code: z.string().min(1).max(10).optional().nullable(),
  job_desc: z.string().max(200).optional().nullable(),
  photo_url: z.string().url().optional().nullable(),
});

export const adminUpdateUserSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(8).max(128).optional(),
  name: z.string().min(1).max(255).optional(),
  portal: userPortalSchema.optional(),
  role: accountRoleSchema.optional(),
  employee_code: z.string().min(1).max(10).nullable().optional(),
  job_desc: z.string().max(200).nullable().optional(),
  photo_url: z.string().url().nullable().optional(),
});

export type UserId = z.infer<typeof userIdSchema>;
export type CreateUser = z.infer<typeof createUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type ProfileName = z.infer<typeof profileNameSchema>;
export type UserPortal = z.infer<typeof userPortalSchema>;
export type AccountRole = z.infer<typeof accountRoleSchema>;
export type AdminUserListQuery = z.infer<typeof adminUserListQuerySchema>;
export type AdminCreateUser = z.infer<typeof adminCreateUserSchema>;
export type AdminUpdateUser = z.infer<typeof adminUpdateUserSchema>;
