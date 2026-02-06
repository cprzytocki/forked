use crate::error::GitClientError;
use crate::git::{self, RepoInfo, RepoStatus};
use crate::state::AppState;
use std::path::PathBuf;
use tauri::State;

#[tauri::command]
pub fn open_repository(path: String, state: State<AppState>) -> Result<RepoInfo, GitClientError> {
    let repo = git::open_repo(&path)?;
    let info = git::get_repo_info(&repo)?;
    state.set_repository(repo, PathBuf::from(&path));
    Ok(info)
}

#[tauri::command]
pub fn init_repository(path: String, state: State<AppState>) -> Result<RepoInfo, GitClientError> {
    let repo = git::init_repo(&path)?;
    let info = git::get_repo_info(&repo)?;
    state.set_repository(repo, PathBuf::from(&path));
    Ok(info)
}

#[tauri::command]
pub fn clone_repository(
    url: String,
    path: String,
    state: State<AppState>,
) -> Result<RepoInfo, GitClientError> {
    let repo = git::clone_repo(&url, &path)?;
    let info = git::get_repo_info(&repo)?;
    state.set_repository(repo, PathBuf::from(&path));
    Ok(info)
}

#[tauri::command]
pub fn get_status(state: State<AppState>) -> Result<RepoStatus, GitClientError> {
    let guard = state.repo.lock();
    let repo = guard.repository.as_ref().ok_or(GitClientError::NoRepository)?;
    git::get_status(repo)
}

#[tauri::command]
pub fn get_repo_info(state: State<AppState>) -> Result<RepoInfo, GitClientError> {
    let guard = state.repo.lock();
    let repo = guard.repository.as_ref().ok_or(GitClientError::NoRepository)?;
    git::get_repo_info(repo)
}

#[tauri::command]
pub fn close_repository(state: State<AppState>) -> Result<(), GitClientError> {
    state.clear_repository();
    Ok(())
}

#[tauri::command]
pub fn get_current_repo_path(state: State<AppState>) -> Result<Option<String>, GitClientError> {
    Ok(state.get_repo_path().map(|p| p.to_string_lossy().to_string()))
}
