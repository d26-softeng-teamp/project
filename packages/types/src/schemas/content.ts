import { z } from "zod";

export const contentIdSchema = z.object({
  fileID: z.string().min(1).max(64),
});

export const createContentSchema = z.object({
  fileID: z.string().min(1).max(64),
  filename: z.string().max(100).nullish(),
  url: z.string().max(100).nullish(),
  content_owner: z.string().max(50).nullish(),
  job_position: z.string().max(20).nullish(),
  last_modified: z.coerce.date().nullish(),
  expiration_date: z.coerce.date().nullish(),
  content_type: z.enum(["Reference", "Workflow"]).nullish(),
  document_status: z.enum(["Created", "in-progress", "Finalized", "Archived"]).nullish(),
});

export const updateContentSchema = createContentSchema.omit({ fileID: true }).partial();

export const contentListQuerySchema = z.object({
  document_status: z.string().optional(),
  content_owner: z.string().optional(),
  job_position: z.string().optional(),
  search: z.string().optional(),
});

export type ContentId = z.infer<typeof contentIdSchema>;
export type CreateContent = z.infer<typeof createContentSchema>;
export type UpdateContent = z.infer<typeof updateContentSchema>;
export type ContentListQuery = z.infer<typeof contentListQuerySchema>;
