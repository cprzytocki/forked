use crate::error::GitClientError;
use crate::git::{self, PullResult, RemoteInfo};
use crate::state::AppState;
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
    state: State<AppState>,
) -> Result<PullResult, GitClientError> {
    let mut guard = state.repo.lock();
    let repo = guard
        .repository
        .as_mut()
        .ok_or(GitClientError::NoRepository)?;

    let is_dirty = git::is_worktree_dirty(repo).map_err(GitClientError::Git)?;
    if is_dirty {
        return Err(GitClientError::Operation(
            "Worktree has uncommitted changes. Commit, stash, or discard them before pulling."
                .to_string(),
        ));
    }

    git::pull_remote(repo, &remote, &branch).map_err(GitClientError::Git)
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
