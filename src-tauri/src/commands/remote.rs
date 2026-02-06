use crate::error::GitClientError;
use crate::git::{self, PullResult, RemoteInfo};
use crate::state::AppState;
use tauri::State;

#[tauri::command]
pub fn fetch(remote: String, state: State<AppState>) -> Result<(), GitClientError> {
    let repo_guard = state.repository.lock();
    let repo = repo_guard.as_ref().ok_or(GitClientError::NoRepository)?;
    git::fetch_remote(repo, &remote).map_err(GitClientError::Git)
}

#[tauri::command]
pub fn pull(
    remote: String,
    branch: String,
    state: State<AppState>,
) -> Result<PullResult, GitClientError> {
    let repo_guard = state.repository.lock();
    let repo = repo_guard.as_ref().ok_or(GitClientError::NoRepository)?;
    git::pull_remote(repo, &remote, &branch).map_err(GitClientError::Git)
}

#[tauri::command]
pub fn push(
    remote: String,
    branch: String,
    state: State<AppState>,
) -> Result<(), GitClientError> {
    let repo_guard = state.repository.lock();
    let repo = repo_guard.as_ref().ok_or(GitClientError::NoRepository)?;
    git::push_remote(repo, &remote, &branch).map_err(GitClientError::Git)
}

#[tauri::command]
pub fn list_remotes(state: State<AppState>) -> Result<Vec<RemoteInfo>, GitClientError> {
    let repo_guard = state.repository.lock();
    let repo = repo_guard.as_ref().ok_or(GitClientError::NoRepository)?;
    git::list_remotes(repo).map_err(GitClientError::Git)
}
