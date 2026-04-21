import { useSearchParams } from "react-router";

export function useContentFilters() {
  const [params, setParams] = useSearchParams();

  const search = params.get("search") ?? "";
  const view = (params.get("view") as "grid" | "list") ?? "grid";
  const status = params.get("status") ?? "";
  const type = params.get("type") ?? "";
  const role = params.get("role") ?? "";

  const tagIdsParam = params.get("tagIds") ?? "";
  const tagIds = tagIdsParam
    ? tagIdsParam
        .split(",")
        .map((s) => Number(s))
        .filter((n) => !Number.isNaN(n))
    : [];

  const tagModeParam = params.get("tagMode");
  const tagMode: "any" | "all" = tagModeParam === "all" ? "all" : "any";

  const pinnedTagIdParam = params.get("pinnedTagId");
  const pinnedTagId =
    pinnedTagIdParam && !Number.isNaN(Number(pinnedTagIdParam)) ? Number(pinnedTagIdParam) : null;

  function update(key: string, value: string) {
    const next = new URLSearchParams(params);

    if (value === "" || value === "all") {
      next.delete(key);
    } else {
      next.set(key, value);
    }

    setParams(next);
  }

  function setTagIds(ids: number[]) {
    const next = new URLSearchParams(params);
    if (ids.length === 0) {
      next.delete("tagIds");
    } else {
      next.set("tagIds", ids.join(","));
    }
    setParams(next);
  }

  function setTagMode(mode: "any" | "all") {
    const next = new URLSearchParams(params);
    if (mode === "any") {
      next.delete("tagMode");
    } else {
      next.set("tagMode", "all");
    }
    setParams(next);
  }

  function setPinnedTagId(id: number | null) {
    const next = new URLSearchParams(params);
    if (id === null) {
      next.delete("pinnedTagId");
    } else {
      next.set("pinnedTagId", String(id));
    }
    setParams(next);
  }

  return {
    search,
    view,
    status,
    type,
    role: role || "all",
    tagIds,
    tagMode,
    pinnedTagId,

    setSearch: (v: string) => update("search", v),
    setView: (v: "grid" | "list") => update("view", v),
    setStatus: (v: string) => update("status", v),
    setType: (v: string) => update("type", v),
    setRole: (v: string) => update("role", v),
    setTagIds,
    setTagMode,
    setPinnedTagId,
  };
}
