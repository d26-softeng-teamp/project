import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ContentView = "grid" | "list";
export type ContentSort = "due" | "name" | "created";
export type ContentSortDir = "asc" | "desc";
export type ContentGroup = "none" | "role";
export type TagMode = "any" | "all";

type ContentFilterState = {
  search: string;
  view: ContentView;
  status: string;
  type: string;
  formats: string[];
  role: string;
  tagIds: number[];
  tagMode: TagMode;
  pinnedTagId: number | null;
  mine: boolean;
  sort: ContentSort;
  sortDir: ContentSortDir;
  group: ContentGroup;
  collapsedGroups: Record<string, boolean>;
  formatSearch: string;
  tagSearch: string;
  sections: {
    role: boolean;
    status: boolean;
    type: boolean;
    format: boolean;
    tags: boolean;
  };
};

type ContentFilterActions = {
  setSearch: (value: string) => void;
  setView: (value: ContentView) => void;
  setStatus: (value: string) => void;
  setType: (value: string) => void;
  setFormats: (value: string[]) => void;
  setRole: (value: string) => void;
  setTagIds: (ids: number[]) => void;
  setTagMode: (mode: TagMode) => void;
  setPinnedTagId: (id: number | null) => void;
  setMine: (value: boolean) => void;
  setSort: (value: ContentSort) => void;
  setSortDir: (value: ContentSortDir) => void;
  setGroup: (value: ContentGroup) => void;
  setGroupCollapsed: (group: string, collapsed: boolean) => void;
  setFormatSearch: (search: string) => void;
  setTagSearch: (search: string) => void;
  setSectionOpen: (section: keyof ContentFilterState["sections"], open: boolean) => void;
  applyFilters: (filters: Partial<ContentFilterState>) => void;
};

export type ContentFilters = ContentFilterState & ContentFilterActions;

const DEFAULT_FILTERS: ContentFilterState = {
  search: "",
  view: "grid",
  status: "",
  type: "",
  formats: [],
  role: "all",
  tagIds: [],
  tagMode: "any",
  pinnedTagId: null,
  mine: false,
  sort: "due",
  sortDir: "asc",
  group: "role",
  collapsedGroups: {},
  formatSearch: "",
  tagSearch: "",
  sections: {
    role: true,
    status: true,
    type: true,
    format: true,
    tags: true,
  },
};

const FILTER_PARAM_KEYS = [
  "search",
  "view",
  "sort",
  "sortDir",
  "group",
  "status",
  "type",
  "formats",
  "role",
  "tagIds",
  "tagMode",
  "pinnedTagId",
  "mine",
] as const;

function isContentView(value: string | null): value is ContentView {
  return value === "grid" || value === "list";
}

function isContentSort(value: string | null): value is ContentSort {
  return value === "due" || value === "name" || value === "created";
}

function isContentSortDir(value: string | null): value is ContentSortDir {
  return value === "asc" || value === "desc";
}

function isContentGroup(value: string | null): value is ContentGroup {
  return value === "none" || value === "role";
}

function parseTagIds(value: string | null) {
  if (!value) return [];
  return value
    .split(",")
    .map((id) => Number(id))
    .filter((id) => Number.isInteger(id));
}

function parseFormats(value: string | null) {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function parsePinnedTagId(value: string | null) {
  if (!value) return null;
  const id = Number(value);
  return Number.isInteger(id) ? id : null;
}

function readFiltersFromParams(params: URLSearchParams): Partial<ContentFilterState> {
  const view = params.get("view");
  const sort = params.get("sort");
  const sortDir = params.get("sortDir");
  const group = params.get("group");

  return {
    search: params.get("search") ?? DEFAULT_FILTERS.search,
    view: isContentView(view) ? view : DEFAULT_FILTERS.view,
    status: params.get("status") ?? DEFAULT_FILTERS.status,
    type: params.get("type") ?? DEFAULT_FILTERS.type,
    formats: parseFormats(params.get("formats")),
    role: params.get("role") || DEFAULT_FILTERS.role,
    tagIds: parseTagIds(params.get("tagIds")),
    tagMode: params.get("tagMode") === "all" ? "all" : DEFAULT_FILTERS.tagMode,
    pinnedTagId: parsePinnedTagId(params.get("pinnedTagId")),
    mine: params.get("mine") === "1",
    sort: isContentSort(sort) ? sort : DEFAULT_FILTERS.sort,
    sortDir: isContentSortDir(sortDir) ? sortDir : DEFAULT_FILTERS.sortDir,
    group: isContentGroup(group) ? group : DEFAULT_FILTERS.group,
  };
}

function writeIfNotDefault(
  params: URLSearchParams,
  key: (typeof FILTER_PARAM_KEYS)[number],
  value: string,
  defaultValue: string,
) {
  if (value === defaultValue || value === "") {
    params.delete(key);
  } else {
    params.set(key, value);
  }
}

function writeFiltersToParams(filters: ContentFilterState, currentParams: URLSearchParams) {
  const next = new URLSearchParams(currentParams);

  for (const key of FILTER_PARAM_KEYS) {
    next.delete(key);
  }

  writeIfNotDefault(next, "search", filters.search, DEFAULT_FILTERS.search);
  writeIfNotDefault(next, "view", filters.view, DEFAULT_FILTERS.view);
  writeIfNotDefault(next, "status", filters.status, DEFAULT_FILTERS.status);
  writeIfNotDefault(next, "type", filters.type, DEFAULT_FILTERS.type);
  writeIfNotDefault(next, "role", filters.role, DEFAULT_FILTERS.role);
  writeIfNotDefault(next, "tagMode", filters.tagMode, DEFAULT_FILTERS.tagMode);
  writeIfNotDefault(next, "sort", filters.sort, DEFAULT_FILTERS.sort);
  writeIfNotDefault(next, "sortDir", filters.sortDir, DEFAULT_FILTERS.sortDir);
  writeIfNotDefault(next, "group", filters.group, DEFAULT_FILTERS.group);

  if (filters.formats.length > 0) {
    next.set("formats", filters.formats.join(","));
  }

  if (filters.tagIds.length > 0) {
    next.set("tagIds", filters.tagIds.join(","));
  }

  if (filters.pinnedTagId !== null) {
    next.set("pinnedTagId", String(filters.pinnedTagId));
  }

  if (filters.mine) {
    next.set("mine", "1");
  } else {
    next.delete("mine");
  }

  return next;
}

function hasFilterParams(params: URLSearchParams) {
  return FILTER_PARAM_KEYS.some((key) => params.has(key));
}

export const useContentFilterStore = create<ContentFilters>()(
  persist(
    (set) => ({
      ...DEFAULT_FILTERS,
      setSearch: (search) => set({ search }),
      setView: (view) => set({ view }),
      setStatus: (status) => set({ status }),
      setType: (type) => set({ type }),
      setFormats: (formats) => set({ formats }),
      setRole: (role) => set({ role: role || DEFAULT_FILTERS.role }),
      setTagIds: (tagIds) => set({ tagIds }),
      setTagMode: (tagMode) => set({ tagMode }),
      setPinnedTagId: (pinnedTagId) => set({ pinnedTagId }),
      setMine: (mine) => set({ mine }),
      setSort: (sort) => set({ sort }),
      setSortDir: (sortDir) => set({ sortDir }),
      setGroup: (group) => set({ group }),
      setGroupCollapsed: (group, collapsed) =>
        set((state) => ({ collapsedGroups: { ...state.collapsedGroups, [group]: collapsed } })),
      setFormatSearch: (formatSearch) => set({ formatSearch }),
      setTagSearch: (tagSearch) => set({ tagSearch }),
      setSectionOpen: (section, open) =>
        set((state) => ({ sections: { ...state.sections, [section]: open } })),
      applyFilters: (filters) => set(filters),
    }),
    {
      name: "content.filters.v4",
      partialize: ({
        view,
        status,
        type,
        formats,
        role,
        tagIds,
        tagMode,
        pinnedTagId,
        sort,
        sortDir,
        group,
        collapsedGroups,
        sections,
      }) => ({
        view,
        status,
        type,
        formats,
        role,
        tagIds,
        tagMode,
        pinnedTagId,
        sort,
        sortDir,
        group,
        collapsedGroups,
        sections,
      }),
    },
  ),
);

export function useContentFilters() {
  const filters = useContentFilterStore();
  const [params, setParams] = useSearchParams();
  const hydratedFromUrlRef = useRef(false);
  const [urlReady, setUrlReady] = useState(false);

  useEffect(() => {
    if (hydratedFromUrlRef.current) return;
    hydratedFromUrlRef.current = true;

    if (hasFilterParams(params)) {
      filters.applyFilters(readFiltersFromParams(params));
    }
    setUrlReady(true);
  }, [filters, params]);

  useEffect(() => {
    if (!urlReady) return;

    const next = writeFiltersToParams(filters, params);
    if (next.toString() !== params.toString()) {
      setParams(next, { replace: true });
    }
  }, [filters, params, setParams, urlReady]);

  return filters;
}
