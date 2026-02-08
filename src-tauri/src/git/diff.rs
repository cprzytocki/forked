use crate::error::GitClientError;
use git2::{DiffOptions, Oid, Repository};
use serde::Serialize;
use std::cell::RefCell;

#[derive(Debug, Serialize, Clone)]
pub struct FileDiff {
    pub path: String,
    pub old_path: Option<String>,
    pub status: String,
    pub hunks: Vec<DiffHunk>,
    pub is_binary: bool,
}

#[derive(Debug, Serialize, Clone)]
pub struct DiffHunk {
    pub old_start: u32,
    pub old_lines: u32,
    pub new_start: u32,
    pub new_lines: u32,
    pub header: String,
    pub lines: Vec<DiffLine>,
}

#[derive(Debug, Serialize, Clone)]
pub struct DiffLine {
    pub origin: char,
    pub content: String,
    pub old_lineno: Option<u32>,
    pub new_lineno: Option<u32>,
}

#[derive(Debug, Serialize, Clone)]
pub struct CommitDiff {
    pub commit_id: String,
    pub files: Vec<FileDiff>,
    pub stats: DiffStats,
}

#[derive(Debug, Serialize, Clone)]
pub struct DiffStats {
    pub files_changed: usize,
    pub insertions: usize,
    pub deletions: usize,
}

pub fn get_file_diff(
    repo: &Repository,
    path: &str,
    staged: bool,
) -> Result<FileDiff, GitClientError> {
    let mut diff_opts = DiffOptions::new();
    diff_opts.pathspec(path);
    diff_opts.context_lines(3);

    let diff = if staged {
        // Diff between HEAD and index (staged changes)
        let head = repo.head()?.peel_to_tree()?;
        repo.diff_tree_to_index(Some(&head), None, Some(&mut diff_opts))?
    } else {
        // Diff between index and workdir (unstaged changes)
        repo.diff_index_to_workdir(None, Some(&mut diff_opts))?
    };

    let file_diff = RefCell::new(FileDiff {
        path: path.to_string(),
        old_path: None,
        status: "unknown".to_string(),
        hunks: Vec::new(),
        is_binary: false,
    });

    let current_hunk: RefCell<Option<DiffHunk>> = RefCell::new(None);

    diff.foreach(
        &mut |delta, _| {
            let mut fd = file_diff.borrow_mut();
            fd.status = match delta.status() {
                git2::Delta::Added => "added".to_string(),
                git2::Delta::Deleted => "deleted".to_string(),
                git2::Delta::Modified => "modified".to_string(),
                git2::Delta::Renamed => "renamed".to_string(),
                git2::Delta::Copied => "copied".to_string(),
                _ => "unknown".to_string(),
            };
            fd.old_path = delta
                .old_file()
                .path()
                .map(|p| p.to_string_lossy().to_string());
            fd.is_binary = delta.new_file().is_binary() || delta.old_file().is_binary();
            true
        },
        Some(&mut |_delta, _binary| {
            file_diff.borrow_mut().is_binary = true;
            true
        }),
        Some(&mut |_delta, hunk| {
            let mut ch = current_hunk.borrow_mut();
            if let Some(h) = ch.take() {
                file_diff.borrow_mut().hunks.push(h);
            }
            *ch = Some(DiffHunk {
                old_start: hunk.old_start(),
                old_lines: hunk.old_lines(),
                new_start: hunk.new_start(),
                new_lines: hunk.new_lines(),
                header: String::from_utf8_lossy(hunk.header()).to_string(),
                lines: Vec::new(),
            });
            true
        }),
        Some(&mut |_delta, _hunk, line| {
            let mut ch = current_hunk.borrow_mut();
            if let Some(ref mut h) = *ch {
                h.lines.push(DiffLine {
                    origin: line.origin(),
                    content: String::from_utf8_lossy(line.content()).to_string(),
                    old_lineno: line.old_lineno(),
                    new_lineno: line.new_lineno(),
                });
            }
            true
        }),
    )?;

    // Push final hunk if any
    if let Some(h) = current_hunk.borrow_mut().take() {
        file_diff.borrow_mut().hunks.push(h);
    }

    Ok(file_diff.into_inner())
}

pub fn get_commit_diff(repo: &Repository, oid_str: &str) -> Result<CommitDiff, GitClientError> {
    let oid = Oid::from_str(oid_str).map_err(|e| GitClientError::Operation(e.to_string()))?;
    let commit = repo.find_commit(oid)?;

    let tree = commit.tree()?;
    let parent_tree = if commit.parent_count() > 0 {
        Some(commit.parent(0)?.tree()?)
    } else {
        None
    };

    let diff = repo.diff_tree_to_tree(parent_tree.as_ref(), Some(&tree), None)?;

    let files: RefCell<Vec<FileDiff>> = RefCell::new(Vec::new());
    let current_file: RefCell<Option<FileDiff>> = RefCell::new(None);
    let current_hunk: RefCell<Option<DiffHunk>> = RefCell::new(None);
    let total_insertions: RefCell<usize> = RefCell::new(0);
    let total_deletions: RefCell<usize> = RefCell::new(0);

    diff.foreach(
        &mut |delta, _| {
            let mut cf = current_file.borrow_mut();
            let mut ch = current_hunk.borrow_mut();

            if let Some(mut file) = cf.take() {
                if let Some(h) = ch.take() {
                    file.hunks.push(h);
                }
                files.borrow_mut().push(file);
            }

            let path = delta
                .new_file()
                .path()
                .or_else(|| delta.old_file().path())
                .map(|p| p.to_string_lossy().to_string())
                .unwrap_or_default();

            *cf = Some(FileDiff {
                path,
                old_path: delta
                    .old_file()
                    .path()
                    .map(|p| p.to_string_lossy().to_string()),
                status: match delta.status() {
                    git2::Delta::Added => "added".to_string(),
                    git2::Delta::Deleted => "deleted".to_string(),
                    git2::Delta::Modified => "modified".to_string(),
                    git2::Delta::Renamed => "renamed".to_string(),
                    git2::Delta::Copied => "copied".to_string(),
                    _ => "unknown".to_string(),
                },
                hunks: Vec::new(),
                is_binary: delta.new_file().is_binary() || delta.old_file().is_binary(),
            });
            true
        },
        Some(&mut |_delta, _binary| {
            if let Some(ref mut file) = *current_file.borrow_mut() {
                file.is_binary = true;
            }
            true
        }),
        Some(&mut |_delta, hunk| {
            let mut cf = current_file.borrow_mut();
            let mut ch = current_hunk.borrow_mut();

            if let Some(ref mut file) = *cf {
                if let Some(h) = ch.take() {
                    file.hunks.push(h);
                }
            }
            *ch = Some(DiffHunk {
                old_start: hunk.old_start(),
                old_lines: hunk.old_lines(),
                new_start: hunk.new_start(),
                new_lines: hunk.new_lines(),
                header: String::from_utf8_lossy(hunk.header()).to_string(),
                lines: Vec::new(),
            });
            true
        }),
        Some(&mut |_delta, _hunk, line| {
            let mut ch = current_hunk.borrow_mut();
            if let Some(ref mut h) = *ch {
                match line.origin() {
                    '+' => *total_insertions.borrow_mut() += 1,
                    '-' => *total_deletions.borrow_mut() += 1,
                    _ => {}
                }
                h.lines.push(DiffLine {
                    origin: line.origin(),
                    content: String::from_utf8_lossy(line.content()).to_string(),
                    old_lineno: line.old_lineno(),
                    new_lineno: line.new_lineno(),
                });
            }
            true
        }),
    )?;

    // Push final file and hunk
    let mut cf = current_file.borrow_mut();
    let mut ch = current_hunk.borrow_mut();
    if let Some(mut file) = cf.take() {
        if let Some(h) = ch.take() {
            file.hunks.push(h);
        }
        files.borrow_mut().push(file);
    }

    let final_files = files.into_inner();
    let files_count = final_files.len();
    let ins = total_insertions.into_inner();
    let del = total_deletions.into_inner();

    Ok(CommitDiff {
        commit_id: oid_str.to_string(),
        files: final_files,
        stats: DiffStats {
            files_changed: files_count,
            insertions: ins,
            deletions: del,
        },
    })
}
