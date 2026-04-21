import { z } from "zod";

export const contentIdSchema = z.object({
  fileID: z.string().min(1).max(64),
});

export const createContentSchema = z.object({
  fileID: z.string().min(1).max(64),
  filename: z.string().max(100).nullish(),
  url: z.string().max(500).nullish(),
  owner_id: z.string().uuid().nullish(),
  job_position: z.string().max(20).nullish(),
  last_modified: z.coerce.date().nullish(),
  expiration_date: z.coerce.date().nullish(),
  content_type: z.enum(["Reference", "Workflow"]).nullish(),
  document_status: z.enum(["Created", "in-progress", "Finalized", "Archived"]).nullish(),
  is_favorited: z.boolean().optional(),
  tagIds: z.array(z.number().int()).optional(),
});

export const updateContentSchema = createContentSchema.omit({ fileID: true }).partial();

export const contentListQuerySchema = z.object({
  document_status: z.string().optional(),
  content_type: z.enum(["Reference", "Workflow"]).optional(),
  owner_id: z.string().uuid().optional(),
  search: z.string().optional(),
  role: z.string().optional(),
  tagIds: z.array(z.number().int()).optional(),
  tagMatchMode: z.enum(["any", "all"]).optional(),
  pinnedTagId: z.number().int().optional(),
});

export const tagIdSchema = z.object({
  id: z.number().int(),
});

export const createTagSchema = z.object({
  name: z.string().min(1).max(100),
  color: z
    .string()
    .regex(/^#([0-9A-Fa-f]{6})$/)
    .optional(),
});

export type ContentId = z.infer<typeof contentIdSchema>;
export type CreateContent = z.infer<typeof createContentSchema>;
export type UpdateContent = z.infer<typeof updateContentSchema>;
export type ContentListQuery = z.infer<typeof contentListQuerySchema>;
export type TagId = z.infer<typeof tagIdSchema>;
export type CreateTag = z.infer<typeof createTagSchema>;
