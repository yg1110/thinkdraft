import { create } from "zustand";
import {
  CreateMemo,
  UpdateMemo,
  DeleteMemo,
  GetMemo,
  ListMemos,
  SearchMemos,
} from "../../wailsjs/go/main/App";
import { memo } from "../../wailsjs/go/models";

interface MemoStore {
  memos: memo.MemoSummary[];
  activeMemo: memo.Memo | null;
  activeId: string | null;
  searchQuery: string;
  loading: boolean;

  loadMemos: () => Promise<void>;
  search: (query: string) => Promise<void>;
  selectMemo: (id: string) => Promise<void>;
  createMemo: () => Promise<void>;
  updateMemo: (title?: string, content?: string) => Promise<void>;
  deleteMemo: (id: string) => Promise<void>;
  selectPrevMemo: () => Promise<void>;
  selectNextMemo: () => Promise<void>;
}

export const useMemoStore = create<MemoStore>((set, get) => ({
  memos: [],
  activeMemo: null,
  activeId: null,
  searchQuery: "",
  loading: false,

  loadMemos: async () => {
    const memos = await ListMemos(0, 100);
    set({ memos: memos || [] });
  },

  search: async (query: string) => {
    set({ searchQuery: query });
    if (query.trim() === "") {
      await get().loadMemos();
      return;
    }
    const results = await SearchMemos(query);
    set({ memos: results || [] });
  },

  selectMemo: async (id: string) => {
    const m = await GetMemo(id);
    set({ activeMemo: m, activeId: id });
  },

  createMemo: async () => {
    const m = await CreateMemo("");
    await get().loadMemos();
    set({ activeMemo: m, activeId: m.id });
  },

  updateMemo: async (title?: string, content?: string) => {
    const { activeId } = get();
    if (!activeId) return;

    const titleArg = title !== undefined ? title : null;
    const contentArg = content !== undefined ? content : null;
    const updated = await UpdateMemo(activeId, titleArg, contentArg);
    set({ activeMemo: updated });
    await get().loadMemos();
  },

  deleteMemo: async (id: string) => {
    await DeleteMemo(id);
    const { activeId } = get();
    if (activeId === id) {
      set({ activeMemo: null, activeId: null });
    }
    await get().loadMemos();
  },

  selectPrevMemo: async () => {
    const { memos, activeId, selectMemo } = get();
    if (memos.length === 0) return;
    if (!activeId) {
      await selectMemo(memos[memos.length - 1].id);
      return;
    }
    const currentIndex = memos.findIndex((m) => m.id === activeId);
    if (currentIndex <= 0) return;
    await selectMemo(memos[currentIndex - 1].id);
  },

  selectNextMemo: async () => {
    const { memos, activeId, selectMemo } = get();
    if (memos.length === 0) return;
    if (!activeId) {
      await selectMemo(memos[0].id);
      return;
    }
    const currentIndex = memos.findIndex((m) => m.id === activeId);
    if (currentIndex < 0 || currentIndex >= memos.length - 1) return;
    await selectMemo(memos[currentIndex + 1].id);
  },
}));
