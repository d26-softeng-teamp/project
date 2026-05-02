import { AnimatePresence, motion } from "framer-motion";
import type { ContentFilters as ContentFiltersState } from "@/store/content-filters";
import { formatStatus } from "@/utils/status";
import { FilterSectionHeader } from "./FilterSectionHeader";
import { SECTION_MOTION } from "./shared";

const STATUS_OPTIONS = ["", "Created", "in-progress", "Finalized", "Archived"] as const;

type Props = {
  filters: ContentFiltersState;
};

export function StatusFilter({ filters }: Props) {
  return (
    <div className="mb-3.5">
      <FilterSectionHeader
        label="Status"
        open={filters.sections.status}
        onToggle={() => filters.setSectionOpen("status", !filters.sections.status)}
        helpTitle="Status filter"
      >
        Narrows content by workflow state, from newly created drafts through finalized or archived
        material.
      </FilterSectionHeader>
      <AnimatePresence initial={false}>
        {filters.sections.status && (
          <motion.div layout {...SECTION_MOTION} className="flex flex-col overflow-hidden">
            {STATUS_OPTIONS.map((s) => {
              const active = filters.status === s;
              const label = s === "" ? "All" : formatStatus(s);
              return (
                <button
                  type="button"
                  key={s || "all"}
                  onClick={() => filters.setStatus(s)}
                  className={`group/row relative flex items-center rounded-md py-1 pl-3 pr-2 text-left text-sm transition-colors ${
                    active
                      ? "bg-hanover-green/[0.06] font-semibold text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <span
                    aria-hidden
                    className={`absolute left-0 h-5 w-[3px] rounded-r transition-colors ${
                      active ? "bg-hanover-green" : "bg-transparent"
                    }`}
                  />
                  <span>{label}</span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
