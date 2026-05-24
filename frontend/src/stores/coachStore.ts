import { create } from "zustand";
import {
  GetWeeklyReport,
  GetTopicSuggestions,
  CheckNudge,
  DismissCoachLog,
} from "../../wailsjs/go/main/App";
import { ai } from "../../wailsjs/go/models";

interface CoachStore {
  weeklyReport: ai.WeeklyReport | null;
  topicSuggestions: ai.TopicSuggestion[];
  nudge: ai.NudgeMessage | null;
  loading: boolean;
  error: string | null;

  loadWeeklyReport: () => Promise<void>;
  loadTopicSuggestions: () => Promise<void>;
  checkNudge: () => Promise<void>;
  dismissNudge: () => Promise<void>;
  dismissReport: () => Promise<void>;
}

export const useCoachStore = create<CoachStore>((set, get) => ({
  weeklyReport: null,
  topicSuggestions: [],
  nudge: null,
  loading: false,
  error: null,

  loadWeeklyReport: async () => {
    set({ loading: true, error: null });
    try {
      const report = await GetWeeklyReport();
      set({ weeklyReport: report, loading: false });
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "string"
          ? err
          : "Failed to load weekly report";
      set({ loading: false, error: message });
    }
  },

  loadTopicSuggestions: async () => {
    set({ loading: true, error: null });
    try {
      const suggestions = await GetTopicSuggestions();
      set({ topicSuggestions: suggestions || [], loading: false });
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "string"
          ? err
          : "Failed to load suggestions";
      set({ loading: false, error: message });
    }
  },

  checkNudge: async () => {
    try {
      const nudge = await CheckNudge();
      set({ nudge: nudge || null });
    } catch {
      // Silently ignore nudge check failures
    }
  },

  dismissNudge: async () => {
    const { nudge } = get();
    if (!nudge) return;
    try {
      await DismissCoachLog(nudge.id);
      set({ nudge: null });
    } catch {
      // Still dismiss locally even if backend fails
      set({ nudge: null });
    }
  },

  dismissReport: async () => {
    const { weeklyReport } = get();
    if (!weeklyReport) return;
    try {
      await DismissCoachLog(weeklyReport.id);
      set({ weeklyReport: null });
    } catch {
      set({ weeklyReport: null });
    }
  },
}));
