use crate::error::GitClientError;
use crate::git::{self, CommitDiff, FileDiff};
use crate::state::AppState;
use tauri::State;

#[tauri::command]
pub fn get_file_diff(
    path: String,
    staged: bool,
    state: State<AppState>,
) -> Result<FileDiff, GitClientError> {
    let guard = state.repo.lock();
    let repo = guard.repository.as_ref().ok_or(GitClientError::NoRepository)?;
    git::get_file_diff(repo, &path, staged)
}

#[tauri::command]
pub fn get_commit_diff(oid: String, state: State<AppState>) -> Result<CommitDiff, GitClientError> {
    let guard = state.repo.lock();
    let repo = guard.repository.as_ref().ok_or(GitClientError::NoRepository)?;
    git::get_commit_diff(repo, &oid)
}
