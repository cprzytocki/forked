use crate::error::GitClientError;
use crate::git::{self, PullResult, RemoteInfo};
use crate::state::AppState;
use git2::StashFlags;
use tauri::State;

#[tauri::command]
pub fn fetch(remote: String, state: State<AppState>) -> Result<(), GitClientError> {
    let guard = state.repo.lock();
    let repo = guard
        .repository
        .as_ref()
        .ok_or(GitClientError::NoRepository)?;
    git::fetch_remote(repo, &remote).map_err(GitClientError::Git)
}

#[tauri::command]
pub fn pull(
    remote: String,
    branch: String,
    auto_stash: bool,
    state: State<AppState>,
) -> Result<PullResult, GitClientError> {
    let mut guard = state.repo.lock();
    let repo = guard
        .repository
        .as_mut()
        .ok_or(GitClientError::NoRepository)?;

    let is_dirty = git::is_worktree_dirty(repo).map_err(GitClientError::Git)?;
    if is_dirty && !auto_stash {
        return Err(GitClientError::Operation(
            "Worktree has uncommitted changes. Confirm auto-stash before pulling.".to_string(),
        ));
    }

    if is_dirty && auto_stash {
        let signature = repo.signature()?;
        repo.stash_save(
            &signature,
            "Auto-stash before pull",
            Some(StashFlags::DEFAULT),
        )?;
    }

    let pull_result = git::pull_remote(repo, &remote, &branch);

    if is_dirty && auto_stash {
        if let Err(pop_error) = repo.stash_pop(0, None) {
            return match pull_result {
                Ok(_) => Err(GitClientError::Operation(format!(
                    "Pull succeeded, but failed to restore auto-stashed changes: {}",
                    pop_error.message()
                ))),
                Err(pull_error) => Err(GitClientError::Operation(format!(
                    "Pull failed ({}), and restoring auto-stashed changes also failed: {}",
                    pull_error.message(),
                    pop_error.message()
                ))),
            };
        }
    }

    pull_result.map_err(GitClientError::Git)
}

#[tauri::command]
pub fn push(remote: String, branch: String, state: State<AppState>) -> Result<(), GitClientError> {
    let guard = state.repo.lock();
    let repo = guard
        .repository
        .as_ref()
        .ok_or(GitClientError::NoRepository)?;
    git::push_remote(repo, &remote, &branch).map_err(GitClientError::Git)
}

#[tauri::command]
pub fn list_remotes(state: State<AppState>) -> Result<Vec<RemoteInfo>, GitClientError> {
    let guard = state.repo.lock();
    let repo = guard
        .repository
        .as_ref()
        .ok_or(GitClientError::NoRepository)?;
    git::list_remotes(repo).map_err(GitClientError::Git)
}
