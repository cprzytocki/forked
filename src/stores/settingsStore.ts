import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  // Recent repositories
  recentRepos: string[];

  // Editor settings
  fontSize: number;
  tabSize: number;

  // Diff settings
  diffContextLines: number;
  showWhitespace: boolean;
  diffViewMode: "unified" | "split";

  // UI settings
  sidebarWidth: number;
  detailsPanelHeight: number;

  // Actions
  addRecentRepo: (path: string) => void;
  removeRecentRepo: (path: string) => void;
  clearRecentRepos: () => void;
  setFontSize: (size: number) => void;
  setTabSize: (size: number) => void;
  setDiffContextLines: (lines: number) => void;
  setShowWhitespace: (show: boolean) => void;
  setDiffViewMode: (mode: "unified" | "split") => void;
  setSidebarWidth: (width: number) => void;
  setDetailsPanelHeight: (height: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      recentRepos: [],
      fontSize: 13,
      tabSize: 4,
      diffContextLines: 3,
      showWhitespace: false,
      diffViewMode: "unified",
      sidebarWidth: 280,
      detailsPanelHeight: 300,

      addRecentRepo: (path: string) => {
        const { recentRepos } = get();
        const filtered = recentRepos.filter((p) => p !== path);
        set({ recentRepos: [path, ...filtered].slice(0, 10) });
      },

      removeRecentRepo: (path: string) => {
        const { recentRepos } = get();
        set({ recentRepos: recentRepos.filter((p) => p !== path) });
      },

      clearRecentRepos: () => set({ recentRepos: [] }),

      setFontSize: (size: number) => set({ fontSize: size }),
      setTabSize: (size: number) => set({ tabSize: size }),
      setDiffContextLines: (lines: number) => set({ diffContextLines: lines }),
      setShowWhitespace: (show: boolean) => set({ showWhitespace: show }),
      setDiffViewMode: (mode: "unified" | "split") => set({ diffViewMode: mode }),
      setSidebarWidth: (width: number) => set({ sidebarWidth: width }),
      setDetailsPanelHeight: (height: number) => set({ detailsPanelHeight: height }),
    }),
    {
      name: "git-client-settings",
    }
  )
);
