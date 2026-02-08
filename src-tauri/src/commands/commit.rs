use crate::error::GitClientError;
use crate::git::{self, CommitDetails, CommitGraphEntry, CommitInfo};
use crate::state::AppState;
use tauri::State;

#[tauri::command]
pub fn stage_file(path: String, state: State<AppState>) -> Result<(), GitClientError> {
    let guard = state.repo.lock();
    let repo = guard
        .repository
        .as_ref()
        .ok_or(GitClientError::NoRepository)?;
    git::stage_file(repo, &path)
}

#[tauri::command]
pub fn unstage_file(path: String, state: State<AppState>) -> Result<(), GitClientError> {
    let guard = state.repo.lock();
    let repo = guard
        .repository
        .as_ref()
        .ok_or(GitClientError::NoRepository)?;
    git::unstage_file(repo, &path)
}

#[tauri::command]
pub fn stage_all(state: State<AppState>) -> Result<(), GitClientError> {
    let guard = state.repo.lock();
    let repo = guard
        .repository
        .as_ref()
        .ok_or(GitClientError::NoRepository)?;
    git::stage_all(repo)
}

#[tauri::command]
pub fn unstage_all(state: State<AppState>) -> Result<(), GitClientError> {
    let guard = state.repo.lock();
    let repo = guard
        .repository
        .as_ref()
        .ok_or(GitClientError::NoRepository)?;
    git::unstage_all(repo)
}

#[tauri::command]
pub fn discard_changes(path: String, state: State<AppState>) -> Result<(), GitClientError> {
    let guard = state.repo.lock();
    let repo = guard
        .repository
        .as_ref()
        .ok_or(GitClientError::NoRepository)?;
    git::discard_changes(repo, &path)
}

#[tauri::command]
pub fn discard_all_changes(state: State<AppState>) -> Result<(), GitClientError> {
    let guard = state.repo.lock();
    let repo = guard
        .repository
        .as_ref()
        .ok_or(GitClientError::NoRepository)?;
    git::discard_all_changes(repo)
}

#[tauri::command]
pub fn create_commit(
    message: String,
    state: State<AppState>,
) -> Result<CommitInfo, GitClientError> {
    let guard = state.repo.lock();
    let repo = guard
        .repository
        .as_ref()
        .ok_or(GitClientError::NoRepository)?;
    git::create_commit(repo, &message)
}

#[tauri::command]
pub fn get_commit_history(
    limit: usize,
    skip: usize,
    state: State<AppState>,
) -> Result<Vec<CommitInfo>, GitClientError> {
    let guard = state.repo.lock();
    let repo = guard
        .repository
        .as_ref()
        .ok_or(GitClientError::NoRepository)?;
    git::get_commit_history(repo, limit, skip)
}

#[tauri::command]
pub fn get_commit_history_with_graph(
    limit: usize,
    skip: usize,
    state: State<AppState>,
) -> Result<Vec<CommitGraphEntry>, GitClientError> {
    let guard = state.repo.lock();
    let repo = guard
        .repository
        .as_ref()
        .ok_or(GitClientError::NoRepository)?;
    git::get_commit_history_with_graph(repo, limit, skip)
}

#[tauri::command]
pub fn get_commit_details(
    oid: String,
    state: State<AppState>,
) -> Result<CommitDetails, GitClientError> {
    let guard = state.repo.lock();
    let repo = guard
        .repository
        .as_ref()
        .ok_or(GitClientError::NoRepository)?;
    git::get_commit_details(repo, &oid)
}
