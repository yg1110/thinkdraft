import { create } from "zustand";
import { SyncNow, GetSyncStatus, GetLastSynced } from "../../wailsjs/go/main/App";

type SyncStatus = "idle" | "syncing" | "error" | "offline";

interface SyncStore {
  status: SyncStatus;
  lastSynced: string | null;

  loadStatus: () => Promise<void>;
  syncNow: () => Promise<void>;
}

export const useSyncStore = create<SyncStore>((set) => ({
  status: "idle",
  lastSynced: null,

  loadStatus: async () => {
    try {
      const [status, lastSynced] = await Promise.all([
        GetSyncStatus(),
        GetLastSynced(),
      ]);
      set({
        status: (status as SyncStatus) || "idle",
        lastSynced: lastSynced || null,
      });
    } catch {
      set({ status: "offline" });
    }
  },

  syncNow: async () => {
    set({ status: "syncing" });
    try {
      await SyncNow();
      const lastSynced = await GetLastSynced();
      set({ status: "idle", lastSynced: lastSynced || null });
    } catch {
      set({ status: "error" });
    }
  },
}));
