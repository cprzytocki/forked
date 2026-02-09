use crate::error::GitClientError;
use crate::git::{self, BranchInfo, MergeResult};
use crate::state::AppState;
use tauri::State;

#[tauri::command]
pub fn list_branches(state: State<AppState>) -> Result<Vec<BranchInfo>, GitClientError> {
    let guard = state.repo.lock();
    let repo = guard
        .repository
        .as_ref()
        .ok_or(GitClientError::NoRepository)?;
    git::list_branches(repo)
}

#[tauri::command]
pub fn create_branch(name: String, source_branch: Option<String>, state: State<AppState>) -> Result<BranchInfo, GitClientError> {
    let guard = state.repo.lock();
    let repo = guard
        .repository
        .as_ref()
        .ok_or(GitClientError::NoRepository)?;
    git::create_branch(repo, &name, source_branch.as_deref())
}

#[tauri::command]
pub fn checkout_branch(name: String, state: State<AppState>) -> Result<(), GitClientError> {
    let guard = state.repo.lock();
    let repo = guard
        .repository
        .as_ref()
        .ok_or(GitClientError::NoRepository)?;
    git::checkout_branch(repo, &name)
}

#[tauri::command]
pub fn delete_branch(name: String, state: State<AppState>) -> Result<(), GitClientError> {
    let guard = state.repo.lock();
    let repo = guard
        .repository
        .as_ref()
        .ok_or(GitClientError::NoRepository)?;
    git::delete_branch(repo, &name)
}

#[tauri::command]
pub fn merge_branch(name: String, state: State<AppState>) -> Result<MergeResult, GitClientError> {
    let guard = state.repo.lock();
    let repo = guard
        .repository
        .as_ref()
        .ok_or(GitClientError::NoRepository)?;
    git::merge_branch(repo, &name)
}
