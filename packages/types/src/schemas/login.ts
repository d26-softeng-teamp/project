import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

/** Which app is performing sign-in (URL); both `employee` and `admin` portal accounts may use either app. */
export const loginPortalSchema = z.enum(["employee", "admin"]);

export const loginWithPortalSchema = loginSchema.extend({
  portal: loginPortalSchema.optional(),
});

export type Login = z.infer<typeof loginSchema>;
export type LoginPortal = z.infer<typeof loginPortalSchema>;
export type LoginWithPortal = z.infer<typeof loginWithPortalSchema>;
