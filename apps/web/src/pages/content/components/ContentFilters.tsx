import { AnimatePresence, motion } from "framer-motion";
import { trpc } from "@/lib/trpc.ts";
import { normalizeTag, renderTag } from "@/utils/tag";

type RoleTab = {
  key: string;
  label: string;
};

type Filters = {
  role: string;
  status: string;
  type: string;
  tagIds: number[];
  tagMode: "any" | "all";
  pinnedTagId: number | null;
  setRole: (v: string) => void;
  setStatus: (v: string) => void;
  setType: (v: string) => void;
  setTagIds: (ids: number[]) => void;
  setTagMode: (mode: "any" | "all") => void;
  setPinnedTagId: (id: number | null) => void;
};

type Props = {
  filters: Filters;
  openRole: boolean;
  setOpenRole: (v: boolean) => void;
  openStatus: boolean;
  setOpenStatus: (v: boolean) => void;
  openType: boolean;
  setOpenType: (v: boolean) => void;
  openTags: boolean;
  setOpenTags: (v: boolean) => void;
  ROLE_TABS: RoleTab[];
};

export function ContentFilters({
  filters,
  openRole,
  setOpenRole,
  openStatus,
  setOpenStatus,
  openType,
  setOpenType,
  openTags,
  setOpenTags,
  ROLE_TABS,
}: Props) {
  const tagsQuery = trpc.tag.list.useQuery();
  const tags = tagsQuery.data ?? [];

  function toggleTag(id: number) {
    if (filters.tagIds.includes(id)) {
      filters.setTagIds(filters.tagIds.filter((t) => t !== id));
    } else {
      filters.setTagIds([...filters.tagIds, id]);
    }
  }

  return (
    <aside className="w-64 shrink-0 rounded border border-border bg-card p-4 h-fit sticky top-4">
      Filters
      <hr />
      {/* ROLE */}
      <div className="mb-4">
        <button
          type="button"
          onClick={() => setOpenRole(!openRole)}
          className="mb-2 flex w-full justify-between text-sm font-semibold"
        >
          Role
          <span className="text-muted-foreground">{openRole ? "−" : "+"}</span>
        </button>

        <AnimatePresence initial={false}>
          {openRole && (
            <motion.div
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="flex flex-col overflow-hidden"
            >
              {ROLE_TABS.map((tab) => {
                const active = filters.role === tab.key;

                return (
                  <button
                    type="button"
                    key={tab.key}
                    onClick={() => filters.setRole(tab.key)}
                    className="relative flex items-center rounded px-2 py-1 text-sm hover:bg-muted"
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded bg-hanover-green" />
                    )}
                    <span className={`ml-2 ${active ? "font-semibold" : "text-muted-foreground"}`}>
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <hr />
      {/* STATUS */}
      <div className="mb-4">
        <button
          type="button"
          onClick={() => setOpenStatus(!openStatus)}
          className="mb-2 flex w-full justify-between text-sm font-semibold"
        >
          Status
          <span className="text-muted-foreground">{openStatus ? "−" : "+"}</span>
        </button>

        <AnimatePresence initial={false}>
          {openStatus && (
            <motion.div
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="flex flex-col overflow-hidden"
            >
              {["", "Created", "in-progress", "Finalized", "Archived"].map((s) => {
                const active = filters.status === s;

                const label = s === "" ? "All" : s === "in-progress" ? "In-Progress" : s;

                return (
                  <button
                    type="button"
                    key={s || "all"}
                    onClick={() => filters.setStatus(s)}
                    className="relative flex items-center rounded px-2 py-1 text-sm hover:bg-muted"
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded bg-hanover-green" />
                    )}
                    <span className={`ml-2 ${active ? "font-semibold" : "text-muted-foreground"}`}>
                      {label}
                    </span>
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <hr />
      {/* TYPE */}
      <div className="mb-4">
        <button
          type="button"
          onClick={() => setOpenType(!openType)}
          className="mb-2 flex w-full justify-between text-sm font-semibold"
        >
          Type
          <span className="text-muted-foreground">{openType ? "−" : "+"}</span>
        </button>

        <AnimatePresence initial={false}>
          {openType && (
            <motion.div
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="flex flex-col overflow-hidden"
            >
              {["", "Reference", "Workflow"].map((t) => {
                const active = filters.type === t;

                return (
                  <button
                    type="button"
                    key={t || "all"}
                    onClick={() => filters.setType(t)}
                    className="relative flex items-center rounded px-2 py-1 text-sm hover:bg-muted"
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded bg-hanover-green" />
                    )}
                    <span className={`ml-2 ${active ? "font-semibold" : "text-muted-foreground"}`}>
                      {t === "" ? "All" : t}
                    </span>
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <hr />
      {/* TAGS */}
      <div>
        <button
          type="button"
          onClick={() => setOpenTags(!openTags)}
          className="mb-2 flex w-full justify-between text-sm font-semibold"
        >
          Tags
          <span className="text-muted-foreground">{openTags ? "−" : "+"}</span>
        </button>

        <AnimatePresence initial={false}>
          {openTags && (
            <motion.div
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="flex flex-col overflow-hidden gap-3"
            >
              {/* ANY / ALL toggle */}
              <div className="flex items-center gap-1 rounded border border-border p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => filters.setTagMode("any")}
                  className={`flex-1 rounded px-2 py-1 ${
                    filters.tagMode === "any"
                      ? "bg-hanover-green text-white font-semibold"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  Match any
                </button>
                <button
                  type="button"
                  onClick={() => filters.setTagMode("all")}
                  className={`flex-1 rounded px-2 py-1 ${
                    filters.tagMode === "all"
                      ? "bg-hanover-green text-white font-semibold"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  Match all
                </button>
              </div>

              {/* Tag checkboxes */}
              <div className="flex flex-col max-h-48 overflow-y-auto">
                {tagsQuery.isLoading && (
                  <span className="px-2 py-1 text-xs text-muted-foreground">Loading tags...</span>
                )}
                {!tagsQuery.isLoading && tags.length === 0 && (
                  <span className="px-2 py-1 text-xs text-muted-foreground">No tags yet</span>
                )}
                {tags.map((tag) => {
                  const cleanTag = normalizeTag(tag);

                  const checked = filters.tagIds.includes(cleanTag.id);
                  const styles = renderTag(cleanTag);

                  return (
                    <label
                      key={cleanTag.id}
                      className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-muted"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleTag(cleanTag.id)}
                        className="h-3.5 w-3.5 accent-hanover-green"
                      />

                      <span
                        style={{
                          backgroundColor: styles.bg,
                          color: styles.text,
                          opacity: checked ? 1 : 0.6,
                        }}
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium transition-all ${
                          checked ? "ring-1" : ""
                        }`}
                      >
                        {cleanTag.name}
                      </span>
                    </label>
                  );
                })}
              </div>

              {filters.tagIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => filters.setTagIds([])}
                  className="self-start text-xs text-muted-foreground hover:underline"
                >
                  Clear tag filter
                </button>
              )}

              {/* Pin-to-top dropdown */}
              <div className="flex flex-col gap-1 pt-2 border-t border-border">
                <label className="flex flex-col gap-1 text-xs font-semibold">
                  Pin tag to top
                  <select
                    value={filters.pinnedTagId ?? ""}
                    onChange={(e) =>
                      filters.setPinnedTagId(e.target.value === "" ? null : Number(e.target.value))
                    }
                    className="rounded border border-border bg-background px-2 py-1 text-xs font-normal"
                  >
                    <option value="">None</option>
                    {tags.map((tag) => (
                      <option key={tag.id} value={tag.id}>
                        {tag.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </aside>
  );
}
