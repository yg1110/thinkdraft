import { create } from "zustand";
import {
  AddTagToMemo,
  RemoveTagFromMemo,
  GetMemoTags,
  ListTags,
  SearchTags,
  SuggestTags,
} from "../../wailsjs/go/main/App";
import { tag } from "../../wailsjs/go/models";

interface TagStore {
  tags: tag.TagWithCount[];
  memoTags: tag.Tag[];
  suggestedTags: string[];
  suggestingTags: boolean;

  loadTags: () => Promise<void>;
  loadMemoTags: (memoID: string) => Promise<void>;
  addTag: (memoID: string, tagName: string) => Promise<void>;
  removeTag: (memoID: string, tagID: string) => Promise<void>;
  searchTags: (prefix: string) => Promise<tag.Tag[]>;
  suggestTags: (memoID: string) => Promise<void>;
  acceptSuggestedTag: (memoID: string, tagName: string) => Promise<void>;
  dismissSuggestedTag: (tagName: string) => void;
  clearSuggestions: () => void;
}

export const useTagStore = create<TagStore>((set, get) => ({
  tags: [],
  memoTags: [],
  suggestedTags: [],
  suggestingTags: false,

  loadTags: async () => {
    const tags = await ListTags();
    set({ tags: tags || [] });
  },

  loadMemoTags: async (memoID: string) => {
    const memoTags = await GetMemoTags(memoID);
    set({ memoTags: memoTags || [] });
  },

  addTag: async (memoID: string, tagName: string) => {
    const newTag = await AddTagToMemo(memoID, tagName);
    const { memoTags } = get();
    set({ memoTags: [...memoTags, newTag] });
    await get().loadTags();
  },

  removeTag: async (memoID: string, tagID: string) => {
    await RemoveTagFromMemo(memoID, tagID);
    const { memoTags } = get();
    set({ memoTags: memoTags.filter((t) => t.id !== tagID) });
    await get().loadTags();
  },

  searchTags: async (prefix: string) => {
    const results = await SearchTags(prefix);
    return results || [];
  },

  suggestTags: async (memoID: string) => {
    set({ suggestingTags: true });
    try {
      const suggestions = await SuggestTags(memoID);
      set({ suggestedTags: suggestions || [], suggestingTags: false });
    } catch {
      set({ suggestingTags: false });
    }
  },

  acceptSuggestedTag: async (memoID: string, tagName: string) => {
    await get().addTag(memoID, tagName);
    const { suggestedTags } = get();
    set({ suggestedTags: suggestedTags.filter((t) => t !== tagName) });
  },

  dismissSuggestedTag: (tagName: string) => {
    const { suggestedTags } = get();
    set({ suggestedTags: suggestedTags.filter((t) => t !== tagName) });
  },

  clearSuggestions: () => {
    set({ suggestedTags: [], suggestingTags: false });
  },
}));
