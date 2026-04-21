import type { ContentItem } from "@/types/content";

type RawContentItem = Partial<ContentItem> & {
  url?: string;
  expiration_date?: string;
};

export function normalizeContent(item: unknown): ContentItem {
  const data = item as RawContentItem;

  return {
    fileID: data.fileID ?? "",

    filename: data.filename ?? undefined,
    document_status: data.document_status ?? undefined,
    content_type: data.content_type ?? undefined,
    job_position: data.job_position ?? undefined,
    is_favorited: data.is_favorited ?? undefined,
    is_checked_out: data.is_checked_out ?? undefined,
    checked_out_by: data.checked_out_by ?? null,
    checked_out_by_user: data.checked_out_by_user ?? null,
    checked_out_at: data.checked_out_at ?? null,
    last_modified: data.last_modified ?? undefined,

    owner: data.owner ?? undefined,
    content_tags: data.content_tags ?? undefined,
  };
}
