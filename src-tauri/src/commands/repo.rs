use crate::error::GitClientError;
use crate::git::{self, RepoInfo, RepoStatus};
use crate::state::AppState;
use crate::watcher::RepoWatcher;
use std::path::PathBuf;
use tauri::{AppHandle, State};

fn start_watcher(state: &AppState, path: &str, app_handle: &AppHandle) {
    // Stop any existing watcher first
    let mut watcher_guard = state.watcher.lock();
    *watcher_guard = None;

    match RepoWatcher::start(PathBuf::from(path), app_handle.clone()) {
        Ok(w) => *watcher_guard = Some(w),
        Err(e) => eprintln!("Failed to start file watcher: {e}"),
    }
}

#[tauri::command]
pub fn open_repository(
    path: String,
    state: State<AppState>,
    app_handle: AppHandle,
) -> Result<RepoInfo, GitClientError> {
    let repo = git::open_repo(&path)?;
    let info = git::get_repo_info(&repo)?;
    state.set_repository(repo, PathBuf::from(&path));
    start_watcher(&state, &path, &app_handle);
    Ok(info)
}

#[tauri::command]
pub fn init_repository(
    path: String,
    state: State<AppState>,
    app_handle: AppHandle,
) -> Result<RepoInfo, GitClientError> {
    let repo = git::init_repo(&path)?;
    let info = git::get_repo_info(&repo)?;
    state.set_repository(repo, PathBuf::from(&path));
    start_watcher(&state, &path, &app_handle);
    Ok(info)
}

#[tauri::command]
pub fn clone_repository(
    url: String,
    path: String,
    state: State<AppState>,
    app_handle: AppHandle,
) -> Result<RepoInfo, GitClientError> {
    let repo = git::clone_repo(&url, &path)?;
    let info = git::get_repo_info(&repo)?;
    state.set_repository(repo, PathBuf::from(&path));
    start_watcher(&state, &path, &app_handle);
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
    // Stop the file watcher
    *state.watcher.lock() = None;
    state.clear_repository();
    Ok(())
}

#[tauri::command]
pub fn get_current_repo_path(state: State<AppState>) -> Result<Option<String>, GitClientError> {
    Ok(state.get_repo_path().map(|p| p.to_string_lossy().to_string()))
}
