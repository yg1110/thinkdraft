import { create } from "zustand";

interface UIStore {
  sidebarOpen: boolean;
  sidebarView: "memos" | "tags" | "drafts" | "coach";
  sidebarCollapsed: boolean;
  memoListWidth: number;
  commandPaletteOpen: boolean;
  templateModalOpen: boolean;
  activeView: "memos" | "drafts";

  toggleSidebar: () => void;
  setSidebarView: (view: UIStore["sidebarView"]) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setMemoListWidth: (width: number) => void;
  toggleCommandPalette: () => void;
  openTemplateModal: () => void;
  closeTemplateModal: () => void;
  setActiveView: (view: UIStore["activeView"]) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  sidebarView: "memos",
  sidebarCollapsed: false,
  memoListWidth: 300,
  commandPaletteOpen: false,
  templateModalOpen: false,
  activeView: "memos",

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarView: (view) => set({ sidebarView: view }),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setMemoListWidth: (width) => set({ memoListWidth: width }),
  toggleCommandPalette: () =>
    set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),
  openTemplateModal: () => set({ templateModalOpen: true }),
  closeTemplateModal: () => set({ templateModalOpen: false }),
  setActiveView: (view) => set({ activeView: view }),
}));
