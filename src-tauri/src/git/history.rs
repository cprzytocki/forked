use crate::error::GitClientError;
use git2::{Oid, Repository, Sort};
use serde::Serialize;
use std::cell::RefCell;

#[derive(Debug, Serialize, Clone)]
pub struct CommitInfo {
    pub id: String,
    pub short_id: String,
    pub message: String,
    pub summary: String,
    pub author_name: String,
    pub author_email: String,
    pub committer_name: String,
    pub committer_email: String,
    pub time: i64,
    pub parent_ids: Vec<String>,
}

#[derive(Debug, Serialize, Clone)]
pub struct CommitDetails {
    pub commit: CommitInfo,
    pub files_changed: Vec<FileChange>,
    pub stats: CommitStats,
}

#[derive(Debug, Serialize, Clone)]
pub struct FileChange {
    pub path: String,
    pub old_path: Option<String>,
    pub status: String,
    pub additions: usize,
    pub deletions: usize,
}

#[derive(Debug, Serialize, Clone)]
pub struct CommitStats {
    pub files_changed: usize,
    pub insertions: usize,
    pub deletions: usize,
}

fn commit_to_info(commit: &git2::Commit) -> CommitInfo {
    let id = commit.id().to_string();
    let short_id = id.chars().take(7).collect();

    CommitInfo {
        id,
        short_id,
        message: commit.message().unwrap_or("").to_string(),
        summary: commit.summary().unwrap_or("").to_string(),
        author_name: commit.author().name().unwrap_or("").to_string(),
        author_email: commit.author().email().unwrap_or("").to_string(),
        committer_name: commit.committer().name().unwrap_or("").to_string(),
        committer_email: commit.committer().email().unwrap_or("").to_string(),
        time: commit.time().seconds(),
        parent_ids: commit.parent_ids().map(|id| id.to_string()).collect(),
    }
}

pub fn get_commit_history(
    repo: &Repository,
    limit: usize,
    skip: usize,
) -> Result<Vec<CommitInfo>, GitClientError> {
    let mut revwalk = repo.revwalk()?;
    revwalk.push_head()?;
    revwalk.set_sorting(Sort::TIME)?;

    let commits: Vec<CommitInfo> = revwalk
        .skip(skip)
        .take(limit)
        .filter_map(|oid| oid.ok())
        .filter_map(|oid| repo.find_commit(oid).ok())
        .map(|commit| commit_to_info(&commit))
        .collect();

    Ok(commits)
}

pub fn get_commit_details(repo: &Repository, oid_str: &str) -> Result<CommitDetails, GitClientError> {
    let oid = Oid::from_str(oid_str).map_err(|e| GitClientError::Operation(e.to_string()))?;
    let commit = repo.find_commit(oid)?;
    let commit_info = commit_to_info(&commit);

    let tree = commit.tree()?;
    let parent_tree = if commit.parent_count() > 0 {
        Some(commit.parent(0)?.tree()?)
    } else {
        None
    };

    let diff = repo.diff_tree_to_tree(parent_tree.as_ref(), Some(&tree), None)?;

    let files_changed: RefCell<Vec<FileChange>> = RefCell::new(Vec::new());
    let total_insertions: RefCell<usize> = RefCell::new(0);
    let total_deletions: RefCell<usize> = RefCell::new(0);

    diff.foreach(
        &mut |delta, _| {
            let status = match delta.status() {
                git2::Delta::Added => "added",
                git2::Delta::Deleted => "deleted",
                git2::Delta::Modified => "modified",
                git2::Delta::Renamed => "renamed",
                git2::Delta::Copied => "copied",
                _ => "unknown",
            };

            let new_path = delta.new_file().path().map(|p| p.to_string_lossy().to_string());
            let old_path = delta.old_file().path().map(|p| p.to_string_lossy().to_string());

            if let Some(path) = new_path {
                files_changed.borrow_mut().push(FileChange {
                    path,
                    old_path,
                    status: status.to_string(),
                    additions: 0,
                    deletions: 0,
                });
            }
            true
        },
        None,
        None,
        Some(&mut |_delta, _hunk, line| {
            let mut fc = files_changed.borrow_mut();
            if let Some(file) = fc.last_mut() {
                match line.origin() {
                    '+' => {
                        file.additions += 1;
                        *total_insertions.borrow_mut() += 1;
                    }
                    '-' => {
                        file.deletions += 1;
                        *total_deletions.borrow_mut() += 1;
                    }
                    _ => {}
                }
            }
            true
        }),
    )?;

    let final_files = files_changed.into_inner();
    let files_count = final_files.len();
    let ins = total_insertions.into_inner();
    let del = total_deletions.into_inner();

    Ok(CommitDetails {
        commit: commit_info,
        files_changed: final_files,
        stats: CommitStats {
            files_changed: files_count,
            insertions: ins,
            deletions: del,
        },
    })
}

pub fn create_commit(repo: &Repository, message: &str) -> Result<CommitInfo, GitClientError> {
    let mut index = repo.index()?;
    let tree_id = index.write_tree()?;
    let tree = repo.find_tree(tree_id)?;

    let signature = repo.signature()?;

    let parent_commit = match repo.head() {
        Ok(head) => Some(head.peel_to_commit()?),
        Err(_) => None,
    };

    let parents: Vec<&git2::Commit> = parent_commit.iter().collect();

    let oid = repo.commit(
        Some("HEAD"),
        &signature,
        &signature,
        message,
        &tree,
        &parents,
    )?;

    let commit = repo.find_commit(oid)?;
    Ok(commit_to_info(&commit))
}
