use crate::error::GitClientError;
use crate::state::AppState;
use git2::StashFlags;
use serde::Serialize;
use tauri::State;

#[derive(Debug, Serialize, Clone)]
pub struct StashEntry {
    pub index: usize,
    pub message: String,
    pub oid: String,
}

#[tauri::command]
pub fn stash_save(message: Option<String>, state: State<AppState>) -> Result<(), GitClientError> {
    let mut guard = state.repo.lock();
    let repo = guard
        .repository
        .as_mut()
        .ok_or(GitClientError::NoRepository)?;

    let signature = repo.signature()?;
    let msg = message.as_deref();

    repo.stash_save(&signature, msg.unwrap_or("WIP"), Some(StashFlags::DEFAULT))?;

    Ok(())
}

#[tauri::command]
pub fn stash_pop(index: usize, state: State<AppState>) -> Result<(), GitClientError> {
    let mut guard = state.repo.lock();
    let repo = guard
        .repository
        .as_mut()
        .ok_or(GitClientError::NoRepository)?;

    repo.stash_pop(index, None)?;

    Ok(())
}

#[tauri::command]
pub fn stash_apply(index: usize, state: State<AppState>) -> Result<(), GitClientError> {
    let mut guard = state.repo.lock();
    let repo = guard
        .repository
        .as_mut()
        .ok_or(GitClientError::NoRepository)?;

    repo.stash_apply(index, None)?;

    Ok(())
}

#[tauri::command]
pub fn stash_drop(index: usize, state: State<AppState>) -> Result<(), GitClientError> {
    let mut guard = state.repo.lock();
    let repo = guard
        .repository
        .as_mut()
        .ok_or(GitClientError::NoRepository)?;

    repo.stash_drop(index)?;

    Ok(())
}

#[tauri::command]
pub fn stash_list(state: State<AppState>) -> Result<Vec<StashEntry>, GitClientError> {
    let mut guard = state.repo.lock();
    let repo = guard
        .repository
        .as_mut()
        .ok_or(GitClientError::NoRepository)?;

    let mut stashes = Vec::new();

    repo.stash_foreach(|index, message, oid| {
        stashes.push(StashEntry {
            index,
            message: message.to_string(),
            oid: oid.to_string(),
        });
        true
    })?;

    Ok(stashes)
}
