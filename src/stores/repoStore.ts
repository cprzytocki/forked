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
import { runAction, runWithLoading } from './storeHelpers';

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
  discardAll: () => Promise<void>;

  // Commit actions
  createCommit: (message: string) => Promise<void>;
  selectCommit: (commit: CommitInfo | null) => void;
  resetToCommit: (commitId: string, mode: 'soft' | 'hard') => Promise<void>;
  squashCommits: (commitIds: string[], message: string) => Promise<void>;

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
    await runWithLoading(set, async () => {
      const repoInfo = await tauri.openRepository(path);
      set({ repoInfo, currentBranch: repoInfo.head_name });
      await get().refreshAll();
    });
  },

  initRepository: async (path: string) => {
    await runWithLoading(set, async () => {
      const repoInfo = await tauri.initRepository(path);
      set({ repoInfo, currentBranch: repoInfo.head_name });
      await get().refreshAll();
    });
  },

  cloneRepository: async (url: string, path: string) => {
    await runWithLoading(set, async () => {
      const repoInfo = await tauri.cloneRepository(url, path);
      set({ repoInfo, currentBranch: repoInfo.head_name });
      await get().refreshAll();
    });
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
    await runAction(set, async () => {
      const status = await tauri.getStatus();
      set({ status });
    });
  },

  refreshCommits: async (limit = 50) => {
    try {
      const { viewingBranch } = get();
      const commits = await tauri.getCommitHistoryWithGraph(
        limit,
        0,
        viewingBranch,
      );
      set({ commits, hasMoreCommits: commits.length >= limit });
    } catch (_e) {
      // Empty repo might not have commits
      set({ commits: [], hasMoreCommits: false });
    }
  },

  loadMoreCommits: async () => {
    const { commits, hasMoreCommits, isLoadingMoreCommits, viewingBranch } =
      get();
    if (!hasMoreCommits || isLoadingMoreCommits) return;

    const pageSize = 50;
    const newLimit = commits.length + pageSize;
    set({ isLoadingMoreCommits: true });
    try {
      const result = await tauri.getCommitHistoryWithGraph(
        newLimit,
        0,
        viewingBranch,
      );
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
    await runAction(set, async () => {
      const branches = await tauri.listBranches();
      const currentBranch = branches.find((b) => b.is_head)?.name || null;
      set({ branches, currentBranch });
    });
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
    await runAction(set, async () => {
      await tauri.stageFile(path);
      await get().refreshStatus();
    });
  },

  unstageFile: async (path: string) => {
    await runAction(set, async () => {
      await tauri.unstageFile(path);
      await get().refreshStatus();
    });
  },

  stageAll: async () => {
    await runAction(set, async () => {
      await tauri.stageAll();
      await get().refreshStatus();
    });
  },

  unstageAll: async () => {
    await runAction(set, async () => {
      await tauri.unstageAll();
      await get().refreshStatus();
    });
  },

  discardChanges: async (path: string) => {
    await runAction(set, async () => {
      await tauri.discardChanges(path);
      await get().refreshStatus();
    });
  },

  discardAll: async () => {
    await runAction(set, async () => {
      await tauri.discardAllChanges();
      await get().refreshStatus();
    });
  },

  createCommit: async (message: string) => {
    await runAction(set, async () => {
      await tauri.createCommit(message);
      await Promise.all([
        get().refreshStatus(),
        get().refreshCommits(),
        get().refreshBranches(),
      ]);
    });
  },

  selectCommit: (commit: CommitInfo | null) => {
    set({ selectedCommit: commit });
  },

  resetToCommit: async (commitId: string, mode: 'soft' | 'hard') => {
    await runAction(set, async () => {
      await tauri.resetToCommit(commitId, mode);
      await get().refreshAll();
    });
  },

  squashCommits: async (commitIds: string[], message: string) => {
    await runAction(set, async () => {
      await tauri.squashCommits(commitIds, message);
      await get().refreshAll();
    });
  },

  createBranch: async (name: string, sourceBranch?: string) => {
    await runAction(set, async () => {
      await tauri.createBranch(name, sourceBranch);
      await get().refreshBranches();
    });
  },

  checkoutBranch: async (name: string) => {
    await runAction(set, async () => {
      await tauri.checkoutBranch(name);
      set({ viewingBranch: null });
      await get().refreshAll();
    });
  },

  deleteBranch: async (name: string) => {
    await runAction(set, async () => {
      await tauri.deleteBranch(name);
      await get().refreshBranches();
    });
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
    await runWithLoading(set, async () => {
      await tauri.fetchRemote(remote);
      await get().refreshBranches();
    }, false);
  },

  pull: async (remote: string, branch: string) => {
    await runWithLoading(set, async () => {
      const result = await tauri.pullRemote(remote, branch);
      if (!result.success) {
        set({ error: result.message });
      }
      await get().refreshAll();
    }, false);
  },

  push: async (remote: string, branch: string) => {
    await runWithLoading(set, async () => {
      await tauri.pushRemote(remote, branch);
      await get().refreshBranches();
    }, false);
  },

  stashSave: async (message?: string) => {
    await runAction(set, async () => {
      await tauri.stashSave(message);
      await Promise.all([get().refreshStatus(), get().refreshStashes()]);
    });
  },

  stashPop: async (index: number) => {
    await runAction(set, async () => {
      await tauri.stashPop(index);
      await Promise.all([get().refreshStatus(), get().refreshStashes()]);
    });
  },

  stashApply: async (index: number) => {
    await runAction(set, async () => {
      await tauri.stashApply(index);
      await Promise.all([get().refreshStatus(), get().refreshStashes()]);
    });
  },

  stashDrop: async (index: number) => {
    await runAction(set, async () => {
      await tauri.stashDrop(index);
      await get().refreshStashes();
    });
  },

  clearError: () => set({ error: null }),
}));
