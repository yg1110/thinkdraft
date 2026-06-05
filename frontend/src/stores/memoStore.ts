import { create } from "zustand";
import {
  CreateMemo,
  UpdateMemo,
  DeleteMemo,
  GetMemo,
  ListMemos,
  SearchMemos,
  GetMemosByTag,
  TogglePinMemo,
} from "../../wailsjs/go/main/App";
import { memo } from "../../wailsjs/go/models";

interface MemoStore {
  memos: memo.MemoSummary[];
  activeMemo: memo.Memo | null;
  activeId: string | null;
  searchQuery: string;
  loading: boolean;
  selectedIds: Set<string>;
  selectMode: boolean;
  filterTagId: string | null;
  filterTagName: string | null;

  loadMemos: () => Promise<void>;
  setFilterTag: (tagId: string | null, tagName?: string | null) => void;
  search: (query: string) => Promise<void>;
  selectMemo: (id: string) => Promise<void>;
  createMemo: () => Promise<void>;
  updateMemo: (title?: string, content?: string) => Promise<void>;
  deleteMemo: (id: string) => Promise<void>;
  selectPrevMemo: () => Promise<void>;
  selectNextMemo: () => Promise<void>;
  togglePinMemo: (id: string) => Promise<void>;
  toggleSelectMode: () => void;
  toggleSelectMemo: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
}

export const useMemoStore = create<MemoStore>((set, get) => ({
  memos: [],
  activeMemo: null,
  activeId: null,
  searchQuery: "",
  loading: false,
  selectedIds: new Set<string>(),
  selectMode: false,
  filterTagId: null,
  filterTagName: null,

  setFilterTag: (tagId: string | null, tagName?: string | null) => {
    set({ filterTagId: tagId, filterTagName: tagName ?? null });
    get().loadMemos();
  },

  loadMemos: async () => {
    const { filterTagId } = get();
    if (filterTagId) {
      const memoIds = await GetMemosByTag(filterTagId);
      if (!memoIds || memoIds.length === 0) {
        set({ memos: [] });
        return;
      }
      // Load full memo list and filter to matching IDs
      const allMemos = await ListMemos(0, 100);
      const idSet = new Set(memoIds);
      set({ memos: (allMemos || []).filter((m) => idSet.has(m.id)) });
      return;
    }
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

  togglePinMemo: async (id: string) => {
    await TogglePinMemo(id);
    await get().loadMemos();
    const { activeId, activeMemo } = get();
    if (activeId === id && activeMemo) {
      const m = await GetMemo(id);
      set({ activeMemo: m });
    }
  },

  toggleSelectMode: () => {
    const { selectMode } = get();
    if (selectMode) {
      set({ selectMode: false, selectedIds: new Set<string>() });
    } else {
      set({ selectMode: true });
    }
  },

  toggleSelectMemo: (id: string) => {
    const { selectedIds } = get();
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    set({ selectedIds: next });
  },

  selectAll: () => {
    const { memos } = get();
    set({ selectedIds: new Set(memos.map((m) => m.id)) });
  },

  clearSelection: () => {
    set({ selectedIds: new Set<string>(), selectMode: false });
  },
}));
