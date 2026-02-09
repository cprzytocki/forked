use crate::error::GitClientError;
use git2::{MergeOptions, Repository};
use serde::Serialize;

#[derive(Debug, Serialize, Clone)]
pub struct MergeResult {
    pub success: bool,
    pub fast_forward: bool,
    pub conflicts: Vec<String>,
    pub message: String,
}

#[derive(Debug, Serialize, Clone)]
pub struct BranchInfo {
    pub name: String,
    pub is_head: bool,
    pub is_remote: bool,
    pub is_default: bool,
    pub upstream: Option<String>,
    pub commit_id: Option<String>,
    pub commit_summary: Option<String>,
    pub ahead: Option<usize>,
    pub behind: Option<usize>,
}

pub fn list_branches(repo: &Repository) -> Result<Vec<BranchInfo>, GitClientError> {
    let mut branches = Vec::new();

    let head = repo.head().ok();
    let head_name = head
        .as_ref()
        .and_then(|h| h.shorthand().map(|s| s.to_string()));

    // Detect the default branch from origin/HEAD (e.g. "refs/remotes/origin/main")
    let default_branch_name = repo
        .find_reference("refs/remotes/origin/HEAD")
        .ok()
        .and_then(|r| r.symbolic_target().map(|s| s.to_string()))
        .and_then(|target| target.strip_prefix("refs/remotes/origin/").map(|s| s.to_string()));

    for branch_result in repo.branches(None)? {
        let (branch, branch_type) = branch_result?;

        let name = branch.name()?.unwrap_or("").to_string();
        let is_remote = branch_type == git2::BranchType::Remote;
        let is_head = head_name.as_ref().map(|h| h == &name).unwrap_or(false);

        let is_default = default_branch_name
            .as_ref()
            .map(|d| name == *d)
            .unwrap_or(false);

        let upstream = branch
            .upstream()
            .ok()
            .and_then(|u| u.name().ok().flatten().map(|s| s.to_string()));

        let commit_obj = branch.get().peel_to_commit().ok();
        let commit_id = commit_obj.as_ref().map(|c| c.id().to_string());
        let commit_summary = commit_obj.as_ref().and_then(|c| c.summary().map(|s| s.to_string()));

        let (ahead, behind) = if !is_remote {
            if let (Some(local_commit), Ok(upstream_ref)) = (&commit_obj, branch.upstream()) {
                upstream_ref
                    .get()
                    .peel_to_commit()
                    .ok()
                    .and_then(|upstream_commit| {
                        repo.graph_ahead_behind(local_commit.id(), upstream_commit.id()).ok()
                    })
                    .map(|(a, b)| (Some(a), Some(b)))
                    .unwrap_or((None, None))
            } else {
                (None, None)
            }
        } else {
            (None, None)
        };

        branches.push(BranchInfo {
            name,
            is_head,
            is_remote,
            is_default,
            upstream,
            commit_id,
            commit_summary,
            ahead,
            behind,
        });
    }

    // Sort: HEAD first, then default branch, then local branches, then remote branches
    branches.sort_by(|a, b| {
        if a.is_head != b.is_head {
            return if a.is_head { std::cmp::Ordering::Less } else { std::cmp::Ordering::Greater };
        }
        if a.is_remote != b.is_remote {
            return if a.is_remote { std::cmp::Ordering::Greater } else { std::cmp::Ordering::Less };
        }
        if a.is_default != b.is_default {
            return if a.is_default { std::cmp::Ordering::Less } else { std::cmp::Ordering::Greater };
        }
        a.name.cmp(&b.name)
    });

    Ok(branches)
}

pub fn create_branch(repo: &Repository, name: &str, source_branch: Option<&str>) -> Result<BranchInfo, GitClientError> {
    let commit = match source_branch {
        Some(source) => {
            let branch = repo
                .find_branch(source, git2::BranchType::Local)
                .or_else(|_| repo.find_branch(source, git2::BranchType::Remote))?;
            branch.get().peel_to_commit()?
        }
        None => {
            let head = repo.head()?;
            head.peel_to_commit()?
        }
    };

    let _branch = repo.branch(name, &commit, false)?;

    Ok(BranchInfo {
        name: name.to_string(),
        is_head: false,
        is_remote: false,
        is_default: false,
        upstream: None,
        commit_id: Some(commit.id().to_string()),
        commit_summary: commit.summary().map(|s| s.to_string()),
        ahead: None,
        behind: None,
    })
}

pub fn checkout_branch(repo: &Repository, name: &str) -> Result<(), GitClientError> {
    let (object, reference) = repo.revparse_ext(name)?;

    repo.checkout_tree(&object, None).map_err(|e| {
        if e.code() == git2::ErrorCode::Conflict {
            GitClientError::Operation(
                "Cannot switch branches: you have uncommitted changes that would be overwritten. Commit or stash them first.".into(),
            )
        } else {
            GitClientError::Git(e)
        }
    })?;

    match reference {
        Some(gref) => repo.set_head(gref.name().ok_or_else(|| {
            GitClientError::Operation("Reference name is not valid UTF-8".into())
        })?)?,
        None => repo.set_head_detached(object.id())?,
    }

    Ok(())
}

pub fn delete_branch(repo: &Repository, name: &str) -> Result<(), GitClientError> {
    let mut branch = repo.find_branch(name, git2::BranchType::Local)?;
    branch.delete()?;
    Ok(())
}

pub fn merge_branch(repo: &Repository, name: &str) -> Result<MergeResult, GitClientError> {
    let (merge_commit, _) = repo.revparse_ext(name)?;
    let annotated_commit = repo.find_annotated_commit(merge_commit.id())?;

    let (analysis, _) = repo.merge_analysis(&[&annotated_commit])?;

    if analysis.is_up_to_date() {
        return Ok(MergeResult {
            success: true,
            fast_forward: false,
            conflicts: Vec::new(),
            message: "Already up to date".to_string(),
        });
    }

    if analysis.is_fast_forward() {
        let head = repo.head()?;
        if !head.is_branch() {
            return Err(GitClientError::Operation(
                "Cannot fast-forward merge: HEAD is detached".into(),
            ));
        }
        let refname = format!("refs/heads/{}", head.shorthand().unwrap_or("HEAD"));
        let mut reference = repo.find_reference(&refname)?;
        reference.set_target(merge_commit.id(), "Fast-forward merge")?;
        repo.checkout_head(Some(git2::build::CheckoutBuilder::default().force()))?;

        return Ok(MergeResult {
            success: true,
            fast_forward: true,
            conflicts: Vec::new(),
            message: format!("Fast-forward to {}", merge_commit.id()),
        });
    }

    // Normal merge
    let mut merge_opts = MergeOptions::new();
    repo.merge(&[&annotated_commit], Some(&mut merge_opts), None)?;

    // Check for conflicts
    let index = repo.index()?;
    let conflicts: Vec<String> = index
        .conflicts()?
        .filter_map(|c| c.ok())
        .filter_map(|c| {
            c.our
                .or(c.their)
                .or(c.ancestor)
                .and_then(|e| String::from_utf8(e.path.clone()).ok())
        })
        .collect();

    if !conflicts.is_empty() {
        let message = format!("Merge conflicts in {} files", conflicts.len());
        return Ok(MergeResult {
            success: false,
            fast_forward: false,
            conflicts,
            message,
        });
    }

    // Auto-commit if no conflicts
    let mut index = repo.index()?;
    let tree_id = index.write_tree()?;
    let tree = repo.find_tree(tree_id)?;
    let signature = repo.signature()?;

    let head_commit = repo.head()?.peel_to_commit()?;
    let merge_commit_obj = repo.find_commit(merge_commit.id())?;

    repo.commit(
        Some("HEAD"),
        &signature,
        &signature,
        &format!("Merge branch '{}'", name),
        &tree,
        &[&head_commit, &merge_commit_obj],
    )?;

    repo.cleanup_state()?;

    Ok(MergeResult {
        success: true,
        fast_forward: false,
        conflicts: Vec::new(),
        message: format!("Merged branch '{}'", name),
    })
}
