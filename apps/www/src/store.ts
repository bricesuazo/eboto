import { create } from "zustand";

interface Store {
  dashboardMenu: boolean;
  toggleDashboardMenu: (input?: boolean) => void;
  spotlight: boolean;
  dashboardChatMenu: boolean;
  toggleDashboardChatMenu: (input?: boolean) => void;
}

export const useStore = create<Store>((set) => ({
  dashboardMenu: false,
  toggleDashboardMenu: (input) =>
    set((state) => ({
      dashboardMenu: input ?? !state.dashboardMenu,
      dashboardChatMenu: false,
    })),
  spotlight: false,
  dashboardChatMenu: false,
  toggleDashboardChatMenu: (input) =>
    set((state) => ({
      dashboardChatMenu: input ?? !state.dashboardChatMenu,
      dashboardMenu: false,
    })),
}));
