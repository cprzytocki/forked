use crate::error::GitClientError;
use git2::{Oid, Repository, Sort};
use serde::Serialize;
use std::cell::RefCell;
use std::collections::HashMap;

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
pub struct GraphConnection {
    pub from_lane: usize,
    pub to_lane: usize,
    pub color_index: usize,
}

#[derive(Debug, Serialize, Clone)]
pub struct PassThroughLane {
    pub lane: usize,
    pub color_index: usize,
}

#[derive(Debug, Serialize, Clone)]
pub struct GraphNode {
    pub lane: usize,
    pub color_index: usize,
    pub connections_to_parents: Vec<GraphConnection>,
    pub pass_through_lanes: Vec<PassThroughLane>,
    pub is_merge: bool,
    pub branch_names: Vec<String>,
}

#[derive(Debug, Serialize, Clone)]
pub struct CommitGraphEntry {
    pub commit: CommitInfo,
    pub graph: GraphNode,
}

fn compute_graph(commits: &[CommitInfo], repo: &Repository) -> Vec<GraphNode> {
    // Collect branch names pointing at each commit
    let mut commit_branches: HashMap<String, Vec<String>> = HashMap::new();
    if let Ok(branches) = repo.branches(None) {
        for (branch, _) in branches.flatten() {
            if let (Some(name), Ok(Some(commit))) = (
                branch.name().ok().flatten(),
                branch.get().peel_to_commit().map(Some),
            ) {
                let oid = commit.id().to_string();
                commit_branches
                    .entry(oid)
                    .or_default()
                    .push(name.to_string());
            }
        }
    }

    // Lane assignment algorithm
    // Active lanes: each slot holds the commit OID that "owns" that lane (the next expected commit in that lane)
    let mut active_lanes: Vec<Option<String>> = Vec::new();
    let mut nodes: Vec<GraphNode> = Vec::with_capacity(commits.len());
    // Track which lane color to assign - we use a simple incrementing counter
    let mut lane_colors: Vec<usize> = Vec::new();
    let mut next_color: usize = 0;

    for commit in commits.iter() {
        let commit_id = &commit.id;
        let is_merge = commit.parent_ids.len() > 1;

        // Find which lane this commit should occupy
        let lane = active_lanes
            .iter()
            .position(|slot| slot.as_deref() == Some(commit_id.as_str()));

        let (node_lane, color_index) = if let Some(l) = lane {
            // This commit was expected in lane l
            let color = lane_colors[l];
            (l, color)
        } else {
            // New lane needed - find first empty or append
            let empty = active_lanes.iter().position(|s| s.is_none());
            let l = empty.unwrap_or_else(|| {
                active_lanes.push(None);
                lane_colors.push(0);
                active_lanes.len() - 1
            });
            let color = next_color;
            next_color += 1;
            lane_colors[l] = color;
            (l, color)
        };

        // Snapshot which lanes are active BEFORE processing this commit's parents.
        // Exclude the node's own lane and any lanes converging into this commit
        // (those will become connections, not pass-throughs).
        let pre_existing_lanes: Vec<(usize, usize)> = active_lanes
            .iter()
            .enumerate()
            .filter_map(|(i, slot)| {
                if i != node_lane && slot.as_deref() != Some(commit_id.as_str()) && slot.is_some() {
                    Some((i, lane_colors[i]))
                } else {
                    None
                }
            })
            .collect();

        // Build connections to parents
        let mut connections: Vec<GraphConnection> = Vec::new();

        if !commit.parent_ids.is_empty() {
            // First parent continues in the same lane
            let first_parent = &commit.parent_ids[0];
            active_lanes[node_lane] = Some(first_parent.clone());

            connections.push(GraphConnection {
                from_lane: node_lane,
                to_lane: node_lane,
                color_index,
            });

            // Additional parents (merge) get their own lanes
            for parent_id in commit.parent_ids.iter().skip(1) {
                // Check if parent already has a lane
                let parent_lane = active_lanes
                    .iter()
                    .position(|slot| slot.as_deref() == Some(parent_id.as_str()));

                let target_lane = if let Some(pl) = parent_lane {
                    pl
                } else {
                    // Allocate a new lane for this parent
                    let empty = active_lanes.iter().position(|s| s.is_none());
                    let l = empty.unwrap_or_else(|| {
                        active_lanes.push(None);
                        lane_colors.push(0);
                        active_lanes.len() - 1
                    });
                    let c = next_color;
                    next_color += 1;
                    lane_colors[l] = c;
                    active_lanes[l] = Some(parent_id.clone());
                    l
                };

                connections.push(GraphConnection {
                    from_lane: node_lane,
                    to_lane: target_lane,
                    color_index: lane_colors[target_lane],
                });
            }
        } else {
            // No parents - free this lane
            active_lanes[node_lane] = None;
        }

        // Close any duplicate lanes for the same commit (can happen with merges)
        // If multiple lanes were pointing to this commit, free the extras
        for i in 0..active_lanes.len() {
            if i != node_lane && active_lanes[i].as_deref() == Some(commit_id.as_str()) {
                // This lane was also waiting for this commit; redirect to first parent or free
                if !commit.parent_ids.is_empty() {
                    active_lanes[i] = Some(commit.parent_ids[0].clone());
                    connections.push(GraphConnection {
                        from_lane: i,
                        to_lane: node_lane,
                        color_index: lane_colors[i],
                    });
                    // Now free this lane since first parent is already in node_lane
                    active_lanes[i] = None;
                } else {
                    active_lanes[i] = None;
                }
            }
        }

        // Pass-through lanes are only those that were active BEFORE this commit,
        // not lanes newly allocated by merge connections on this row.
        let pass_through_lanes: Vec<PassThroughLane> = pre_existing_lanes
            .into_iter()
            .filter(|(i, _)| {
                // Also exclude lanes that were closed (duplicate lane handling above)
                active_lanes[*i].is_some()
            })
            .map(|(lane, color_index)| PassThroughLane { lane, color_index })
            .collect();

        let branch_names = commit_branches.get(commit_id).cloned().unwrap_or_default();

        nodes.push(GraphNode {
            lane: node_lane,
            color_index,
            connections_to_parents: connections,
            pass_through_lanes,
            is_merge,
            branch_names,
        });
    }

    nodes
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
    branch_name: Option<&str>,
) -> Result<Vec<CommitInfo>, GitClientError> {
    let mut revwalk = repo.revwalk()?;
    match branch_name {
        Some(name) => {
            let reference = repo
                .find_branch(name, git2::BranchType::Local)
                .or_else(|_| repo.find_branch(name, git2::BranchType::Remote))
                .map_err(|e| GitClientError::Operation(format!("Branch '{}' not found: {}", name, e)))?;
            let oid = reference
                .get()
                .target()
                .ok_or_else(|| GitClientError::Operation(format!("Branch '{}' has no target", name)))?;
            revwalk.push(oid)?;
        }
        None => {
            revwalk.push_head()?;
        }
    }
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

pub fn get_commit_details(
    repo: &Repository,
    oid_str: &str,
) -> Result<CommitDetails, GitClientError> {
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

            let new_path = delta
                .new_file()
                .path()
                .map(|p| p.to_string_lossy().to_string());
            let old_path = delta
                .old_file()
                .path()
                .map(|p| p.to_string_lossy().to_string());

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

pub fn get_commit_history_with_graph(
    repo: &Repository,
    limit: usize,
    skip: usize,
    branch_name: Option<&str>,
) -> Result<Vec<CommitGraphEntry>, GitClientError> {
    let commits = get_commit_history(repo, limit, skip, branch_name)?;
    let graph_nodes = compute_graph(&commits, repo);

    let entries: Vec<CommitGraphEntry> = commits
        .into_iter()
        .zip(graph_nodes)
        .map(|(commit, graph)| CommitGraphEntry { commit, graph })
        .collect();

    Ok(entries)
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
