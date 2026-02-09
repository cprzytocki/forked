import { create } from 'zustand';
import * as tauri from '@/lib/tauri';
import type {
  BranchInfo,
  CommitGraphEntry,
  CommitInfo,
  RemoteInfo,
  RepoInfo,
  RepoStatus,
  StashEntry,
} from '@/lib/types';

interface RepoState {
  // Repository state
  repoInfo: RepoInfo | null;
  status: RepoStatus | null;
  isLoading: boolean;
  error: string | null;

  // Commits
  commits: CommitGraphEntry[];
  selectedCommit: CommitInfo | null;
  hasMoreCommits: boolean;
  isLoadingMoreCommits: boolean;

  // Branches
  branches: BranchInfo[];
  currentBranch: string | null;
  viewingBranch: string | null;

  // Remotes
  remotes: RemoteInfo[];

  // Stashes
  stashes: StashEntry[];

  // Actions
  openRepository: (path: string) => Promise<void>;
  initRepository: (path: string) => Promise<void>;
  cloneRepository: (url: string, path: string) => Promise<void>;
  closeRepository: () => void;
  refreshStatus: () => Promise<void>;
  refreshCommits: (limit?: number) => Promise<void>;
  loadMoreCommits: () => Promise<void>;
  refreshBranches: () => Promise<void>;
  refreshRemotes: () => Promise<void>;
  refreshStashes: () => Promise<void>;
  refreshAll: () => Promise<void>;

  // Staging actions
  stageFile: (path: string) => Promise<void>;
  unstageFile: (path: string) => Promise<void>;
  stageAll: () => Promise<void>;
  unstageAll: () => Promise<void>;
  discardChanges: (path: string) => Promise<void>;

  // Commit actions
  createCommit: (message: string) => Promise<void>;
  selectCommit: (commit: CommitInfo | null) => void;
  resetToCommit: (commitId: string, mode: 'soft' | 'hard') => Promise<void>;

  // Branch actions
  createBranch: (name: string, sourceBranch?: string) => Promise<void>;
  checkoutBranch: (name: string) => Promise<void>;
  deleteBranch: (name: string) => Promise<void>;
  mergeBranch: (name: string) => Promise<void>;
  viewBranchCommits: (name: string | null) => Promise<void>;

  // Remote actions
  fetch: (remote: string) => Promise<void>;
  pull: (remote: string, branch: string) => Promise<void>;
  push: (remote: string, branch: string) => Promise<void>;

  // Stash actions
  stashSave: (message?: string) => Promise<void>;
  stashPop: (index: number) => Promise<void>;
  stashApply: (index: number) => Promise<void>;
  stashDrop: (index: number) => Promise<void>;

  // Error handling
  clearError: () => void;
}

export const useRepoStore = create<RepoState>((set, get) => ({
  repoInfo: null,
  status: null,
  isLoading: false,
  error: null,
  commits: [],
  selectedCommit: null,
  hasMoreCommits: true,
  isLoadingMoreCommits: false,
  branches: [],
  currentBranch: null,
  viewingBranch: null,
  remotes: [],
  stashes: [],

  openRepository: async (path: string) => {
    set({ isLoading: true, error: null });
    try {
      const repoInfo = await tauri.openRepository(path);
      set({ repoInfo, currentBranch: repoInfo.head_name });
      await get().refreshAll();
    } catch (e) {
      set({ error: String(e) });
    } finally {
      set({ isLoading: false });
    }
  },

  initRepository: async (path: string) => {
    set({ isLoading: true, error: null });
    try {
      const repoInfo = await tauri.initRepository(path);
      set({ repoInfo, currentBranch: repoInfo.head_name });
      await get().refreshAll();
    } catch (e) {
      set({ error: String(e) });
    } finally {
      set({ isLoading: false });
    }
  },

  cloneRepository: async (url: string, path: string) => {
    set({ isLoading: true, error: null });
    try {
      const repoInfo = await tauri.cloneRepository(url, path);
      set({ repoInfo, currentBranch: repoInfo.head_name });
      await get().refreshAll();
    } catch (e) {
      set({ error: String(e) });
    } finally {
      set({ isLoading: false });
    }
  },

  closeRepository: () => {
    tauri.closeRepository();
    set({
      repoInfo: null,
      status: null,
      commits: [],
      selectedCommit: null,
      hasMoreCommits: true,
      isLoadingMoreCommits: false,
      branches: [],
      currentBranch: null,
      viewingBranch: null,
      remotes: [],
      stashes: [],
    });
  },

  refreshStatus: async () => {
    try {
      const status = await tauri.getStatus();
      set({ status });
    } catch (e) {
      set({ error: String(e) });
    }
  },

  refreshCommits: async (limit = 50) => {
    try {
      const { viewingBranch } = get();
      const commits = await tauri.getCommitHistoryWithGraph(limit, 0, viewingBranch);
      set({ commits, hasMoreCommits: commits.length >= limit });
    } catch (_e) {
      // Empty repo might not have commits
      set({ commits: [], hasMoreCommits: false });
    }
  },

  loadMoreCommits: async () => {
    const { commits, hasMoreCommits, isLoadingMoreCommits, viewingBranch } = get();
    if (!hasMoreCommits || isLoadingMoreCommits) return;

    const pageSize = 50;
    const newLimit = commits.length + pageSize;
    set({ isLoadingMoreCommits: true });
    try {
      const result = await tauri.getCommitHistoryWithGraph(newLimit, 0, viewingBranch);
      set({
        commits: result,
        hasMoreCommits: result.length >= newLimit,
        isLoadingMoreCommits: false,
      });
    } catch (_e) {
      set({ isLoadingMoreCommits: false });
    }
  },

  refreshBranches: async () => {
    try {
      const branches = await tauri.listBranches();
      const currentBranch = branches.find((b) => b.is_head)?.name || null;
      set({ branches, currentBranch });
    } catch (e) {
      set({ error: String(e) });
    }
  },

  refreshRemotes: async () => {
    try {
      const remotes = await tauri.listRemotes();
      set({ remotes });
    } catch (_e) {
      set({ remotes: [] });
    }
  },

  refreshStashes: async () => {
    try {
      const stashes = await tauri.stashList();
      set({ stashes });
    } catch (_e) {
      set({ stashes: [] });
    }
  },

  refreshAll: async () => {
    await Promise.all([
      get().refreshStatus(),
      get().refreshCommits(),
      get().refreshBranches(),
      get().refreshRemotes(),
      get().refreshStashes(),
    ]);
  },

  stageFile: async (path: string) => {
    try {
      await tauri.stageFile(path);
      await get().refreshStatus();
    } catch (e) {
      set({ error: String(e) });
    }
  },

  unstageFile: async (path: string) => {
    try {
      await tauri.unstageFile(path);
      await get().refreshStatus();
    } catch (e) {
      set({ error: String(e) });
    }
  },

  stageAll: async () => {
    try {
      await tauri.stageAll();
      await get().refreshStatus();
    } catch (e) {
      set({ error: String(e) });
    }
  },

  unstageAll: async () => {
    try {
      await tauri.unstageAll();
      await get().refreshStatus();
    } catch (e) {
      set({ error: String(e) });
    }
  },

  discardChanges: async (path: string) => {
    try {
      await tauri.discardChanges(path);
      await get().refreshStatus();
    } catch (e) {
      set({ error: String(e) });
    }
  },

  createCommit: async (message: string) => {
    try {
      await tauri.createCommit(message);
      await Promise.all([get().refreshStatus(), get().refreshCommits()]);
    } catch (e) {
      set({ error: String(e) });
    }
  },

  selectCommit: (commit: CommitInfo | null) => {
    set({ selectedCommit: commit });
  },

  resetToCommit: async (commitId: string, mode: 'soft' | 'hard') => {
    try {
      await tauri.resetToCommit(commitId, mode);
      await get().refreshAll();
    } catch (e) {
      set({ error: String(e) });
    }
  },

  createBranch: async (name: string, sourceBranch?: string) => {
    try {
      await tauri.createBranch(name, sourceBranch);
      await get().refreshBranches();
    } catch (e) {
      set({ error: String(e) });
    }
  },

  checkoutBranch: async (name: string) => {
    try {
      await tauri.checkoutBranch(name);
      set({ viewingBranch: null });
      await get().refreshAll();
    } catch (e) {
      set({ error: String(e) });
    }
  },

  deleteBranch: async (name: string) => {
    try {
      await tauri.deleteBranch(name);
      await get().refreshBranches();
    } catch (e) {
      set({ error: String(e) });
    }
  },

  mergeBranch: async (name: string) => {
    try {
      const result = await tauri.mergeBranch(name);
      if (!result.success) {
        set({ error: result.message });
      }
      await get().refreshAll();
    } catch (e) {
      set({ error: String(e) });
    }
  },

  viewBranchCommits: async (name: string | null) => {
    set({ viewingBranch: name });
    try {
      const commits = await tauri.getCommitHistoryWithGraph(50, 0, name);
      set({ commits, hasMoreCommits: commits.length >= 50 });
    } catch (_e) {
      set({ commits: [], hasMoreCommits: false });
    }
  },

  fetch: async (remote: string) => {
    set({ isLoading: true });
    try {
      await tauri.fetchRemote(remote);
      await get().refreshBranches();
    } catch (e) {
      set({ error: String(e) });
    } finally {
      set({ isLoading: false });
    }
  },

  pull: async (remote: string, branch: string) => {
    set({ isLoading: true });
    try {
      const result = await tauri.pullRemote(remote, branch);
      if (!result.success) {
        set({ error: result.message });
      }
      await get().refreshAll();
    } catch (e) {
      set({ error: String(e) });
    } finally {
      set({ isLoading: false });
    }
  },

  push: async (remote: string, branch: string) => {
    set({ isLoading: true });
    try {
      await tauri.pushRemote(remote, branch);
    } catch (e) {
      set({ error: String(e) });
    } finally {
      set({ isLoading: false });
    }
  },

  stashSave: async (message?: string) => {
    try {
      await tauri.stashSave(message);
      await Promise.all([get().refreshStatus(), get().refreshStashes()]);
    } catch (e) {
      set({ error: String(e) });
    }
  },

  stashPop: async (index: number) => {
    try {
      await tauri.stashPop(index);
      await Promise.all([get().refreshStatus(), get().refreshStashes()]);
    } catch (e) {
      set({ error: String(e) });
    }
  },

  stashApply: async (index: number) => {
    try {
      await tauri.stashApply(index);
      await Promise.all([get().refreshStatus(), get().refreshStashes()]);
    } catch (e) {
      set({ error: String(e) });
    }
  },

  stashDrop: async (index: number) => {
    try {
      await tauri.stashDrop(index);
      await get().refreshStashes();
    } catch (e) {
      set({ error: String(e) });
    }
  },

  clearError: () => set({ error: null }),
}));
