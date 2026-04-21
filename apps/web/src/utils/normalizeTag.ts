export function normalizeTag(tag: { id: number; name: string; color: string | null }) {
  return {
    id: tag.id,
    name: tag.name,
    color: tag.color ?? undefined,
  };
}
