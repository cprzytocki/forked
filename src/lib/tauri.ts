import { invoke } from '@tauri-apps/api/core';
import type {
  BranchInfo,
  CommitDetails,
  CommitDiff,
  CommitGraphEntry,
  CommitInfo,
  FileDiff,
  GitConfig,
  MergeResult,
  PullResult,
  RemoteInfo,
  RepoInfo,
  RepoStatus,
  StashEntry,
} from './types';

// Repository commands
export async function openRepository(path: string): Promise<RepoInfo> {
  return invoke('open_repository', { path });
}

export async function initRepository(path: string): Promise<RepoInfo> {
  return invoke('init_repository', { path });
}

export async function cloneRepository(
  url: string,
  path: string,
): Promise<RepoInfo> {
  return invoke('clone_repository', { url, path });
}

export async function getStatus(): Promise<RepoStatus> {
  return invoke('get_status');
}

export async function getRepoInfo(): Promise<RepoInfo> {
  return invoke('get_repo_info');
}

export async function closeRepository(): Promise<void> {
  return invoke('close_repository');
}

export async function getCurrentRepoPath(): Promise<string | null> {
  return invoke('get_current_repo_path');
}

// Staging commands
export async function stageFile(path: string): Promise<void> {
  return invoke('stage_file', { path });
}

export async function unstageFile(path: string): Promise<void> {
  return invoke('unstage_file', { path });
}

export async function stageAll(): Promise<void> {
  return invoke('stage_all');
}

export async function unstageAll(): Promise<void> {
  return invoke('unstage_all');
}

export async function discardChanges(path: string): Promise<void> {
  return invoke('discard_changes', { path });
}

export async function discardAllChanges(): Promise<void> {
  return invoke('discard_all_changes');
}

// Commit commands
export async function createCommit(message: string): Promise<CommitInfo> {
  return invoke('create_commit', { message });
}

export async function getCommitHistory(
  limit: number = 50,
  skip: number = 0,
): Promise<CommitInfo[]> {
  return invoke('get_commit_history', { limit, skip });
}

export async function getCommitHistoryWithGraph(
  limit: number = 50,
  skip: number = 0,
  branchName?: string | null,
): Promise<CommitGraphEntry[]> {
  return invoke('get_commit_history_with_graph', { limit, skip, branchName: branchName ?? null });
}

export async function getCommitDetails(oid: string): Promise<CommitDetails> {
  return invoke('get_commit_details', { oid });
}

export async function resetToCommit(commitId: string, mode: 'soft' | 'hard'): Promise<void> {
  return invoke('reset_to_commit', { commitId, mode });
}

export async function squashCommits(
  commitIds: string[],
  message: string,
): Promise<void> {
  return invoke('squash_commits', { commitIds, message });
}

// Branch commands
export async function listBranches(): Promise<BranchInfo[]> {
  return invoke('list_branches');
}

export async function createBranch(name: string, sourceBranch?: string): Promise<BranchInfo> {
  return invoke('create_branch', { name, sourceBranch });
}

export async function checkoutBranch(name: string): Promise<void> {
  return invoke('checkout_branch', { name });
}

export async function deleteBranch(name: string): Promise<void> {
  return invoke('delete_branch', { name });
}

export async function mergeBranch(name: string): Promise<MergeResult> {
  return invoke('merge_branch', { name });
}

// Remote commands
export async function fetchRemote(remote: string): Promise<void> {
  return invoke('fetch', { remote });
}

export async function pullRemote(
  remote: string,
  branch: string,
  autoStash: boolean = false,
): Promise<PullResult> {
  return invoke('pull', { remote, branch, autoStash });
}

export async function pushRemote(
  remote: string,
  branch: string,
): Promise<void> {
  return invoke('push', { remote, branch });
}

export async function listRemotes(): Promise<RemoteInfo[]> {
  return invoke('list_remotes');
}

// Diff commands
export async function getFileDiff(
  path: string,
  staged: boolean,
): Promise<FileDiff> {
  return invoke('get_file_diff', { path, staged });
}

export async function getCommitDiff(oid: string): Promise<CommitDiff> {
  return invoke('get_commit_diff', { oid });
}

// Stash commands
export async function stashSave(message?: string): Promise<void> {
  return invoke('stash_save', { message });
}

export async function stashPop(index: number): Promise<void> {
  return invoke('stash_pop', { index });
}

export async function stashApply(index: number): Promise<void> {
  return invoke('stash_apply', { index });
}

export async function stashDrop(index: number): Promise<void> {
  return invoke('stash_drop', { index });
}

export async function stashList(): Promise<StashEntry[]> {
  return invoke('stash_list');
}

// Config commands
export async function getGitConfig(): Promise<GitConfig> {
  return invoke('get_git_config');
}

// another test
export async function setGitConfig(key: string, value: string): Promise<void> {
  return invoke('set_git_config', { key, value });
}
