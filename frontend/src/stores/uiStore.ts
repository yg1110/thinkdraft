import { create } from "zustand";

interface UIStore {
  sidebarOpen: boolean;
  sidebarView: "memos" | "tags" | "drafts" | "coach";
  sidebarCollapsed: boolean;
  memoListWidth: number;
  commandPaletteOpen: boolean;

  toggleSidebar: () => void;
  setSidebarView: (view: UIStore["sidebarView"]) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setMemoListWidth: (width: number) => void;
  toggleCommandPalette: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  sidebarView: "memos",
  sidebarCollapsed: false,
  memoListWidth: 300,
  commandPaletteOpen: false,

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarView: (view) => set({ sidebarView: view }),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setMemoListWidth: (width) => set({ memoListWidth: width }),
  toggleCommandPalette: () =>
    set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),
}));
