import { create } from "zustand";
import { persist } from "zustand/middleware";

export type DashboardTab = "overview" | "metrics" | "tags";

type AppPreferencesState = {
  coworkerSearch: string;
  usersSearch: string;
  tagsSearch: string;
  dashboardTab: DashboardTab;
  heroExpanded: boolean;
  dashboardWidgetOrder: string[];
};

type AppPreferencesActions = {
  setCoworkerSearch: (search: string) => void;
  setUsersSearch: (search: string) => void;
  setTagsSearch: (search: string) => void;
  setDashboardTab: (tab: DashboardTab) => void;
  setHeroExpanded: (expanded: boolean) => void;
  setDashboardWidgetOrder: (order: string[]) => void;
  swapDashboardWidgets: (a: string, b: string) => void;
};

type AppPreferences = AppPreferencesState & AppPreferencesActions;

export const DEFAULT_DASHBOARD_WIDGET_ORDER = [
  "content-by-status",
  "side-panel",
  "employees",
  "recent-content",
];

const DEFAULT_PREFERENCES: AppPreferencesState = {
  coworkerSearch: "",
  usersSearch: "",
  tagsSearch: "",
  dashboardTab: "overview",
  heroExpanded: true,
  dashboardWidgetOrder: DEFAULT_DASHBOARD_WIDGET_ORDER,
};

export const useAppPreferences = create<AppPreferences>()(
  persist(
    (set) => ({
      ...DEFAULT_PREFERENCES,
      setCoworkerSearch: (coworkerSearch) => set({ coworkerSearch }),
      setUsersSearch: (usersSearch) => set({ usersSearch }),
      setTagsSearch: (tagsSearch) => set({ tagsSearch }),
      setDashboardTab: (dashboardTab) => set({ dashboardTab }),
      setHeroExpanded: (heroExpanded) => set({ heroExpanded }),
      setDashboardWidgetOrder: (dashboardWidgetOrder) => set({ dashboardWidgetOrder }),
      swapDashboardWidgets: (a, b) =>
        set((state) => {
          const order = [...state.dashboardWidgetOrder];
          const ai = order.indexOf(a);
          const bi = order.indexOf(b);
          if (ai === -1 || bi === -1) return state;
          [order[ai], order[bi]] = [order[bi], order[ai]];
          return { dashboardWidgetOrder: order };
        }),
    }),
    {
      name: "app.preferences.v2",
      partialize: ({
        coworkerSearch,
        usersSearch,
        tagsSearch,
        dashboardTab,
        heroExpanded,
        dashboardWidgetOrder,
      }) => ({
        coworkerSearch,
        usersSearch,
        tagsSearch,
        dashboardTab,
        heroExpanded,
        dashboardWidgetOrder,
      }),
    },
  ),
);
