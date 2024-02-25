import { create } from "zustand";

interface Store {
  dashboardMenu: boolean;
  toggleDashboardMenu: (input?: boolean) => void;
  spotlight: boolean;
  dashboardChatMenu: boolean;
  toggleDashboardChatMenu: (input?: boolean) => void;
  electionBoost: boolean;
  electionBoostElectionId: string | null;
  setElectionBoostElectionId: (input: string) => void;
  toggleElectionBoost: (input?: boolean) => void;
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
  electionBoost: false,
  electionBoostElectionId: null,
  setElectionBoostElectionId: (input) =>
    set(() => ({
      electionBoostElectionId: input,
    })),
  toggleElectionBoost: (input) =>
    set((state) => ({
      electionBoost: input ?? !state.electionBoost,
      electionBoostElectionId: null,
    })),
}));
