import { Check, Pencil, Trash2, X } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { ColorPicker } from "@/pages/tags/components/ColorPicker.tsx";
import { normalizeTag, renderTag } from "@/utils/tag";

type EditState = {
  id: number;
  name: string;
  color: string;
} | null;

export default function TagsPage() {
  const utils = trpc.useUtils();

  const tagsQuery = trpc.tag.list.useQuery();

  const deleteTag = trpc.tag.delete.useMutation({
    onSuccess: () => utils.tag.list.invalidate(),
  });

  const updateTag = trpc.tag.update.useMutation({
    onSuccess: () => utils.tag.list.invalidate(),
  });

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [errorMap, setErrorMap] = useState<Record<number, string>>({});
  const [edit, setEdit] = useState<EditState>(null);
  const [search, setSearch] = useState("");

  if (tagsQuery.isPending) {
    return <div className="p-6 text-sm text-muted-foreground">Loading tags...</div>;
  }

  const tags = (tagsQuery.data ?? [])
    .map(normalizeTag)
    .filter((tag) => tag.name.toLowerCase().includes(search.toLowerCase()));

  function toggleTag(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleSaveEdit() {
    if (!edit) return;

    const trimmedName = edit.name.trim();

    const nameTaken = tags.some(
      (t) => t.id !== edit.id && t.name.toLowerCase() === trimmedName.toLowerCase(),
    );

    const colorTaken = tags.some((t) => t.id !== edit.id && (t.color ?? "") === edit.color);

    if (nameTaken || colorTaken) {
      const message = nameTaken ? "Name already in use" : "Color already in use";

      setErrorMap((prev) => ({
        ...prev,
        [edit.id]: message,
      }));

      // auto-remove after 3s
      setTimeout(() => {
        setErrorMap((prev) => {
          const next = { ...prev };
          delete next[edit.id];
          return next;
        });
      }, 3000);

      return;
    }

    await updateTag.mutateAsync({
      id: edit.id,
      name: trimmedName,
      color: edit.color,
    });

    setEdit(null);
    setErrorMap({});
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return;

    if (!confirm(`Delete ${selectedIds.size} selected tag(s)?`)) return;

    const errors: Record<number, string> = {};

    for (const id of selectedIds) {
      try {
        await deleteTag.mutateAsync({ id });
      } catch (err: unknown) {
        errors[id] = err instanceof Error ? err.message : "Failed to delete";
      }
    }

    setErrorMap(errors);

    // auto-clear each error after 3s
    Object.keys(errors).forEach((id) => {
      setTimeout(() => {
        setErrorMap((prev) => {
          const next = { ...prev };
          delete next[Number(id)];
          return next;
        });
      }, 3000);
    });
    setSelectedIds(new Set());
    utils.tag.list.invalidate();
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-4 text-2xl font-bold">Tag Management</h1>

      {/* SEARCH */}
      <input
        type="text"
        placeholder="Search tags..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 w-full rounded border px-3 py-2 text-sm"
      />

      {/* BULK BAR */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{selectedIds.size} selected</p>

        <button
          type="button"
          onClick={handleBulkDelete}
          disabled={selectedIds.size === 0}
          className="rounded-md bg-red-500 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
        >
          <Trash2 className="mr-1 inline h-3.5 w-3.5" />
          Delete Selected
        </button>
      </div>

      {/* TAG LIST */}
      <div className="grid gap-3">
        {tags.map((tag) => {
          const styles = renderTag(tag);
          const isEditing = edit?.id === tag.id;

          return (
            <div
              key={tag.id}
              className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
            >
              <div className="flex items-center gap-3">
                {/* checkbox */}
                <input
                  type="checkbox"
                  checked={selectedIds.has(tag.id)}
                  onChange={() => toggleTag(tag.id)}
                />

                {/* TAG / EDIT */}
                {!isEditing ? (
                  <span
                    style={{
                      backgroundColor: styles.bg,
                      color: styles.text,
                    }}
                    className="rounded-full px-3 py-1 text-xs font-medium"
                  >
                    {tag.name}
                  </span>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      value={edit.name}
                      onChange={(e) => setEdit({ ...edit, name: e.target.value })}
                      className="rounded border px-2 py-1 text-xs"
                    />

                    <ColorPicker
                      value={edit.color}
                      onChange={(color) => setEdit((prev) => (prev ? { ...prev, color } : prev))}
                    />
                  </div>
                )}

                <span className="text-xs text-muted-foreground">#{tag.id}</span>

                {errorMap[tag.id] && (
                  <span className="text-xs text-red-500">{errorMap[tag.id]}</span>
                )}
              </div>

              {/* ACTIONS */}
              <div className="flex items-center gap-2">
                {!isEditing ? (
                  <button
                    type="button"
                    onClick={() =>
                      setEdit({
                        id: tag.id,
                        name: tag.name,
                        color: tag.color ?? "#22c55e",
                      })
                    }
                    className="rounded border px-2 py-1 text-xs"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                ) : (
                  <>
                    <button type="button" onClick={handleSaveEdit}>
                      <Check className="h-4 w-4 text-green-600" />
                    </button>

                    <button type="button" onClick={() => setEdit(null)}>
                      <X className="h-4 w-4 text-red-500" />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* EMPTY STATE */}
      {tags.length === 0 && <p className="mt-4 text-sm text-muted-foreground">No tags found.</p>}
    </div>
  );
}
