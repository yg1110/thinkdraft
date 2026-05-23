import { create } from "zustand";
import {
  GenerateBlogDraft,
  GetBlogDraft,
  ListBlogDrafts,
  UpdateBlogDraft,
  DeleteBlogDraft,
} from "../../wailsjs/go/main/App";
import { ai } from "../../wailsjs/go/models";

interface BlogStore {
  drafts: ai.BlogDraftSummary[];
  activeDraft: ai.BlogDraft | null;
  activeDraftId: string | null;
  generating: boolean;
  error: string | null;

  loadDrafts: () => Promise<void>;
  selectDraft: (id: string) => Promise<void>;
  generateDraft: (memoIDs: string[], template: string) => Promise<void>;
  updateDraft: (title?: string, content?: string) => Promise<void>;
  deleteDraft: (id: string) => Promise<void>;
  clearActiveDraft: () => void;
}

export const useBlogStore = create<BlogStore>((set, get) => ({
  drafts: [],
  activeDraft: null,
  activeDraftId: null,
  generating: false,
  error: null,

  loadDrafts: async () => {
    const drafts = await ListBlogDrafts();
    set({ drafts: drafts || [] });
  },

  selectDraft: async (id: string) => {
    const draft = await GetBlogDraft(id);
    set({ activeDraft: draft, activeDraftId: id });
  },

  generateDraft: async (memoIDs: string[], template: string) => {
    set({ generating: true, error: null });
    try {
      const draft = await GenerateBlogDraft(memoIDs, template);
      set({
        activeDraft: draft,
        activeDraftId: draft.id,
        generating: false,
      });
      await get().loadDrafts();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : typeof err === "string" ? err : "Generation failed";
      set({ generating: false, error: message });
      throw err;
    }
  },

  updateDraft: async (title?: string, content?: string) => {
    const { activeDraftId } = get();
    if (!activeDraftId) return;

    const titleArg = title !== undefined ? title : null;
    const contentArg = content !== undefined ? content : null;
    const updated = await UpdateBlogDraft(activeDraftId, titleArg, contentArg);
    set({ activeDraft: updated });
    await get().loadDrafts();
  },

  deleteDraft: async (id: string) => {
    await DeleteBlogDraft(id);
    const { activeDraftId } = get();
    if (activeDraftId === id) {
      set({ activeDraft: null, activeDraftId: null });
    }
    await get().loadDrafts();
  },

  clearActiveDraft: () => {
    set({ activeDraft: null, activeDraftId: null });
  },
}));
