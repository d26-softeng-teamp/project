export function normalizeTag(tag: { id: number; name: string; color: string | null }) {
  return {
    id: tag.id,
    name: tag.name,
    color: tag.color ?? undefined,
  };
}

export type TagShape = {
  id: number;
  name: string;
  color?: string;
};

export function renderTag(tag: TagShape) {
  const color = tag.color ?? "#15803d";

  return {
    bg: `${color}12`,
    softBg: `${color}18`,
    text: color,
  };
}
