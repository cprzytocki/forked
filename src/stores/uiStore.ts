import { create } from 'zustand';
import * as tauri from '@/lib/tauri';
import type { CommitDiff, FileDiff, FileStatus } from '@/lib/types';

export type ViewMode = 'changes' | 'history';
export type SidebarTab = 'changes' | 'branches';
export type DetailView = 'diff' | 'commit' | 'none';

interface UiState {
  // View state
  viewMode: ViewMode;
  sidebarTab: SidebarTab;
  detailView: DetailView;

  // Selection state
  selectedFile: FileStatus | null;
  selectedFilePath: string | null;
  isSelectedFileStaged: boolean;

  // Diff state
  currentFileDiff: FileDiff | null;
  currentCommitDiff: CommitDiff | null;
  isDiffLoading: boolean;

  // Dialog state
  isCloneDialogOpen: boolean;
  isInitDialogOpen: boolean;
  isCreateBranchDialogOpen: boolean;
  isMergeDialogOpen: boolean;
  isStashDialogOpen: boolean;

  // Theme
  theme: 'light' | 'dark';

  // Actions
  setViewMode: (mode: ViewMode) => void;
  setSidebarTab: (tab: SidebarTab) => void;
  setDetailView: (view: DetailView) => void;
  selectFile: (file: FileStatus | null, staged: boolean) => void;
  loadFileDiff: (path: string, staged: boolean) => Promise<void>;
  loadCommitDiff: (oid: string) => Promise<void>;
  clearDiff: () => void;

  // Dialog actions
  openCloneDialog: () => void;
  closeCloneDialog: () => void;
  openInitDialog: () => void;
  closeInitDialog: () => void;
  openCreateBranchDialog: () => void;
  closeCreateBranchDialog: () => void;
  openMergeDialog: () => void;
  closeMergeDialog: () => void;
  openStashDialog: () => void;
  closeStashDialog: () => void;

  // Theme
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useUiStore = create<UiState>((set, get) => ({
  viewMode: 'changes',
  sidebarTab: 'branches',
  detailView: 'none',
  selectedFile: null,
  selectedFilePath: null,
  isSelectedFileStaged: false,
  currentFileDiff: null,
  currentCommitDiff: null,
  isDiffLoading: false,
  isCloneDialogOpen: false,
  isInitDialogOpen: false,
  isCreateBranchDialogOpen: false,
  isMergeDialogOpen: false,
  isStashDialogOpen: false,
  theme: 'dark',

  setViewMode: (mode: ViewMode) => set({ viewMode: mode }),
  setSidebarTab: (tab: SidebarTab) => set({ sidebarTab: tab }),
  setDetailView: (view: DetailView) => set({ detailView: view }),

  selectFile: (file: FileStatus | null, staged: boolean) => {
    set({
      selectedFile: file,
      selectedFilePath: file?.path || null,
      isSelectedFileStaged: staged,
      detailView: file ? 'diff' : 'none',
    });
    if (file) {
      get().loadFileDiff(file.path, staged);
    } else {
      get().clearDiff();
    }
  },

  loadFileDiff: async (path: string, staged: boolean) => {
    set({ isDiffLoading: true });
    try {
      const diff = await tauri.getFileDiff(path, staged);
      set({ currentFileDiff: diff, currentCommitDiff: null });
    } catch (e) {
      console.error('Failed to load diff:', e);
      set({ currentFileDiff: null });
    } finally {
      set({ isDiffLoading: false });
    }
  },

  loadCommitDiff: async (oid: string) => {
    set({ isDiffLoading: true, detailView: 'commit' });
    try {
      const diff = await tauri.getCommitDiff(oid);
      set({ currentCommitDiff: diff, currentFileDiff: null });
    } catch (e) {
      console.error('Failed to load commit diff:', e);
      set({ currentCommitDiff: null });
    } finally {
      set({ isDiffLoading: false });
    }
  },

  clearDiff: () =>
    set({
      currentFileDiff: null,
      currentCommitDiff: null,
      selectedFile: null,
      selectedFilePath: null,
    }),

  openCloneDialog: () => set({ isCloneDialogOpen: true }),
  closeCloneDialog: () => set({ isCloneDialogOpen: false }),
  openInitDialog: () => set({ isInitDialogOpen: true }),
  closeInitDialog: () => set({ isInitDialogOpen: false }),
  openCreateBranchDialog: () => set({ isCreateBranchDialogOpen: true }),
  closeCreateBranchDialog: () => set({ isCreateBranchDialogOpen: false }),
  openMergeDialog: () => set({ isMergeDialogOpen: true }),
  closeMergeDialog: () => set({ isMergeDialogOpen: false }),
  openStashDialog: () => set({ isStashDialogOpen: true }),
  closeStashDialog: () => set({ isStashDialogOpen: false }),

  toggleTheme: () => {
    const newTheme = get().theme === 'light' ? 'dark' : 'light';
    set({ theme: newTheme });
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  },

  setTheme: (theme: 'light' | 'dark') => {
    set({ theme });
    document.documentElement.classList.toggle('dark', theme === 'dark');
  },
}));
