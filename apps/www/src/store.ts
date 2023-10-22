import { create } from "zustand";

interface Store {
  dashboardMenu: boolean;
  toggleDashboardMenu: (input?: boolean) => void;
}

export const useStore = create<Store>((set) => ({
  dashboardMenu: false,
  toggleDashboardMenu: (input) =>
    set((state) => ({ dashboardMenu: input ?? !state.dashboardMenu })),
  spotlight: false,
}));
