import { z } from "zod";

export const appUserIdSchema = z.object({
  id: z.string(),
});

export const appUserListQuerySchema = z.object({
  search: z.string().optional(),
});

export const createAppUserSchema = z.object({
  username: z.string().min(1).max(50),
  password: z.string().min(1).max(100),
  role: z.enum(["admin", "underwriter", "business-analyst"]),
  display_name: z.string().max(100).nullable().optional(),
});

export const updateAppUserSchema = z.object({
  username: z.string().min(1).max(50).optional(),
  password: z.string().min(1).max(100).optional(),
  role: z.enum(["admin", "underwriter", "business-analyst"]).optional(),
  display_name: z.string().max(100).nullable().optional(),
});

export type AppUserId = z.infer<typeof appUserIdSchema>;
export type AppUserListQuery = z.infer<typeof appUserListQuerySchema>;
export type CreateAppUser = z.infer<typeof createAppUserSchema>;
export type UpdateAppUser = z.infer<typeof updateAppUserSchema>;
