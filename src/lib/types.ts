// Repository types
export interface RepoInfo {
  path: string;
  name: string;
  is_bare: boolean;
  head_name: string | null;
  head_oid: string | null;
}

export interface FileStatus {
  path: string;
  status: string;
  is_staged: boolean;
  is_modified: boolean;
  is_new: boolean;
  is_deleted: boolean;
  is_renamed: boolean;
  is_conflicted: boolean;
}

export interface RepoStatus {
  staged: FileStatus[];
  unstaged: FileStatus[];
  untracked: FileStatus[];
  conflicted: FileStatus[];
}

// Commit types
export interface CommitInfo {
  id: string;
  short_id: string;
  message: string;
  summary: string;
  author_name: string;
  author_email: string;
  committer_name: string;
  committer_email: string;
  time: number;
  parent_ids: string[];
}

export interface FileChange {
  path: string;
  old_path: string | null;
  status: string;
  additions: number;
  deletions: number;
}

export interface CommitStats {
  files_changed: number;
  insertions: number;
  deletions: number;
}

export interface CommitDetails {
  commit: CommitInfo;
  files_changed: FileChange[];
  stats: CommitStats;
}

// Graph types
export interface GraphConnection {
  from_lane: number;
  to_lane: number;
  color_index: number;
}

export interface GraphNode {
  lane: number;
  color_index: number;
  connections_to_parents: GraphConnection[];
  is_merge: boolean;
  branch_names: string[];
}

export interface CommitGraphEntry {
  commit: CommitInfo;
  graph: GraphNode;
}

// Branch types
export interface BranchInfo {
  name: string;
  is_head: boolean;
  is_remote: boolean;
  upstream: string | null;
  commit_id: string | null;
  commit_summary: string | null;
}

export interface MergeResult {
  success: boolean;
  fast_forward: boolean;
  conflicts: string[];
  message: string;
}

// Remote types
export interface RemoteInfo {
  name: string;
  url: string;
  push_url: string | null;
}

export interface PullResult {
  success: boolean;
  fast_forward: boolean;
  conflicts: string[];
  message: string;
}

// Diff types
export interface DiffLine {
  origin: string;
  content: string;
  old_lineno: number | null;
  new_lineno: number | null;
}

export interface DiffHunk {
  old_start: number;
  old_lines: number;
  new_start: number;
  new_lines: number;
  header: string;
  lines: DiffLine[];
}

export interface FileDiff {
  path: string;
  old_path: string | null;
  status: string;
  hunks: DiffHunk[];
  is_binary: boolean;
}

export interface DiffStats {
  files_changed: number;
  insertions: number;
  deletions: number;
}

export interface CommitDiff {
  commit_id: string;
  files: FileDiff[];
  stats: DiffStats;
}

// Stash types
export interface StashEntry {
  index: number;
  message: string;
  oid: string;
}

// Config types
export interface GitConfig {
  user_name: string | null;
  user_email: string | null;
}
