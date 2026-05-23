import { create } from "zustand";

interface UIStore {
  sidebarOpen: boolean;
  sidebarView: "memos" | "tags" | "drafts" | "coach";
  toggleSidebar: () => void;
  setSidebarView: (view: UIStore["sidebarView"]) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  sidebarView: "memos",
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarView: (view) => set({ sidebarView: view }),
}));
