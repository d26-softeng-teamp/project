import { Check, Pencil, Plus, Tag, Trash2, X } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { ColorPicker } from "@/pages/tags/components/ColorPicker.tsx";
import { normalizeTag, renderTag } from "@/utils/tag";

type EditState = {
  id: number;
  name: string;
  color: string;
} | null;

type AddState = {
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

  const createTag = trpc.tag.create.useMutation({
    onSuccess: () => {
      utils.tag.list.invalidate();
      setAdd(null);
      setAddError("");
    },
  });

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [errorMap, setErrorMap] = useState<Record<number, string>>({});
  const [edit, setEdit] = useState<EditState>(null);
  const [add, setAdd] = useState<AddState>(null);
  const [addError, setAddError] = useState("");
  const [search, setSearch] = useState("");

  if (tagsQuery.isPending) {
    return (
      <div className="flex items-center justify-center py-16">
        <Tag className="h-5 w-5 animate-pulse text-hanover-green mr-2" />
        <span className="text-sm text-muted-foreground">Loading tags...</span>
      </div>
    );
  }

  const allTags = (tagsQuery.data ?? []).map(normalizeTag);
  const tags = allTags.filter((tag) => tag.name.toLowerCase().includes(search.toLowerCase()));

  function toggleTag(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selectedIds.size === tags.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(tags.map((t) => t.id)));
    }
  }

  async function handleSaveEdit() {
    if (!edit) return;

    const trimmedName = edit.name.trim();
    if (!trimmedName) return;

    const nameTaken = allTags.some(
      (t) => t.id !== edit.id && t.name.toLowerCase() === trimmedName.toLowerCase(),
    );
    const colorTaken = allTags.some((t) => t.id !== edit.id && (t.color ?? "") === edit.color);

    if (nameTaken || colorTaken) {
      const message = nameTaken ? "Name already in use" : "Color already in use";
      setErrorMap((prev) => ({ ...prev, [edit.id]: message }));
      setTimeout(() => {
        setErrorMap((prev) => {
          const next = { ...prev };
          delete next[edit.id];
          return next;
        });
      }, 3000);
      return;
    }

    await updateTag.mutateAsync({ id: edit.id, name: trimmedName, color: edit.color });
    setEdit(null);
    setErrorMap({});
  }

  async function handleAddSave() {
    if (!add) return;
    const trimmedName = add.name.trim();
    if (!trimmedName) {
      setAddError("Name is required");
      return;
    }
    const nameTaken = allTags.some((t) => t.name.toLowerCase() === trimmedName.toLowerCase());
    if (nameTaken) {
      setAddError("Name already in use");
      return;
    }
    setAddError("");
    await createTag.mutateAsync({ name: trimmedName, color: add.color });
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

  const allSelected = tags.length > 0 && selectedIds.size === tags.length;

  return (
    <div className="min-h-full py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        {/* ── Header ── */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2.5 text-3xl font-bold text-foreground">
              <Tag className="h-7 w-7 text-hanover-green" />
              Tag Management
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {allTags.length} tag{allTags.length !== 1 ? "s" : ""} total
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setAdd({ name: "", color: "#15803d" });
              setEdit(null);
              setAddError("");
            }}
            disabled={add !== null}
            className="flex shrink-0 items-center gap-2 rounded-md bg-hanover-green px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-hanover-green/90 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Add Tag
          </button>
        </div>

        {/* ── Add Tag Form ── */}
        {add !== null && (
          <div className="mb-6 rounded-lg border border-hanover-green/30 bg-hanover-green/5 p-4 shadow-sm">
            <p className="mb-3 text-sm font-semibold text-foreground">New Tag</p>
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                placeholder="Tag name..."
                value={add.name}
                onChange={(e) => {
                  setAdd({ ...add, name: e.target.value });
                  setAddError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddSave();
                  if (e.key === "Escape") {
                    setAdd(null);
                    setAddError("");
                  }
                }}
                className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hanover-green min-w-[160px]"
              />
              <ColorPicker value={add.color} onChange={(color) => setAdd({ ...add, color })} />

              {/* Preview */}
              <span
                className="rounded-full px-3 py-1 text-xs font-medium border"
                style={{
                  backgroundColor: `${add.color}18`,
                  color: add.color,
                  borderColor: `${add.color}30`,
                }}
              >
                {add.name || "Preview"}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddSave}
                  disabled={createTag.isPending}
                  className="flex items-center gap-1.5 rounded-md bg-hanover-green px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-hanover-green/90 disabled:opacity-50"
                >
                  <Check className="h-3.5 w-3.5" />
                  {createTag.isPending ? "Saving…" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAdd(null);
                    setAddError("");
                  }}
                  className="flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
                >
                  <X className="h-3.5 w-3.5" />
                  Cancel
                </button>
              </div>
            </div>
            {addError && <p className="mt-2 text-xs text-red-500">{addError}</p>}
          </div>
        )}

        {/* ── Search + Bulk Bar ── */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Tag className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-hanover-green"
            />
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {selectedIds.size > 0 && (
              <span className="text-xs text-muted-foreground">{selectedIds.size} selected</span>
            )}
            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={selectedIds.size === 0}
              className="flex items-center gap-1.5 rounded-md bg-red-500 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-600 disabled:pointer-events-none disabled:opacity-40"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete Selected
            </button>
          </div>
        </div>

        {/* ── Tag Table ── */}
        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          {/* Table header */}
          <div className="grid grid-cols-[2rem_1fr_5rem_6rem] items-center gap-4 border-b border-border bg-muted/60 px-4 py-2.5">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              className="rounded"
              title="Select all"
            />
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Tag
            </span>
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              ID
            </span>
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground text-right">
              Actions
            </span>
          </div>

          {/* Tag rows */}
          {tags.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <Tag className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                {search ? "No tags match your search." : "No tags yet. Create one above."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {tags.map((tag) => {
                const styles = renderTag(tag);
                const isEditing = edit?.id === tag.id;

                return (
                  <div
                    key={tag.id}
                    className={`grid grid-cols-[2rem_1fr_5rem_6rem] items-center gap-4 px-4 py-3 transition-colors ${
                      selectedIds.has(tag.id) ? "bg-hanover-green/5" : "hover:bg-muted/40"
                    }`}
                  >
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedIds.has(tag.id)}
                      onChange={() => toggleTag(tag.id)}
                      className="rounded"
                    />

                    {/* Tag pill / edit inputs */}
                    <div className="flex min-w-0 items-center gap-2">
                      {!isEditing ? (
                        <span
                          style={{
                            backgroundColor: styles.bg,
                            color: styles.text,
                            borderColor: `${tag.color ?? "#15803d"}30`,
                          }}
                          className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium"
                        >
                          {tag.name}
                        </span>
                      ) : (
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            value={edit.name}
                            onChange={(e) => setEdit({ ...edit, name: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveEdit();
                              if (e.key === "Escape") setEdit(null);
                            }}
                            className="rounded-md border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-hanover-green w-32"
                          />
                          <ColorPicker
                            value={edit.color}
                            onChange={(color) =>
                              setEdit((prev) => (prev ? { ...prev, color } : prev))
                            }
                          />
                          {/* Preview while editing */}
                          <span
                            style={{
                              backgroundColor: `${edit.color}18`,
                              color: edit.color,
                              borderColor: `${edit.color}30`,
                            }}
                            className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium"
                          >
                            {edit.name || "Preview"}
                          </span>
                        </div>
                      )}
                      {errorMap[tag.id] && (
                        <span className="text-xs text-red-500">{errorMap[tag.id]}</span>
                      )}
                    </div>

                    {/* ID */}
                    <span className="font-mono text-xs text-muted-foreground">#{tag.id}</span>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-1">
                      {!isEditing ? (
                        <button
                          type="button"
                          onClick={() =>
                            setEdit({ id: tag.id, name: tag.name, color: tag.color ?? "#22c55e" })
                          }
                          className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={handleSaveEdit}
                            disabled={updateTag.isPending}
                            className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-hanover-green transition-colors hover:bg-hanover-green/10 disabled:opacity-50"
                          >
                            <Check className="h-3.5 w-3.5" />
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEdit(null)}
                            className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer count */}
        {tags.length > 0 && (
          <p className="mt-3 text-right text-xs text-muted-foreground">
            {tags.length} tag{tags.length !== 1 ? "s" : ""}
            {search && ` matching "${search}"`}
          </p>
        )}
      </div>
    </div>
  );
}
