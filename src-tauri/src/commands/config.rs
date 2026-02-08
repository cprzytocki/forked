use crate::error::GitClientError;
use crate::state::AppState;
use serde::Serialize;
use tauri::State;

#[derive(Debug, Serialize, Clone)]
pub struct GitConfig {
    pub user_name: Option<String>,
    pub user_email: Option<String>,
}

#[tauri::command]
pub fn get_git_config(state: State<AppState>) -> Result<GitConfig, GitClientError> {
    let guard = state.repo.lock();
    let repo = guard
        .repository
        .as_ref()
        .ok_or(GitClientError::NoRepository)?;

    let config = repo.config()?;

    let user_name = config.get_string("user.name").ok();
    let user_email = config.get_string("user.email").ok();

    Ok(GitConfig {
        user_name,
        user_email,
    })
}

#[tauri::command]
pub fn set_git_config(
    key: String,
    value: String,
    state: State<AppState>,
) -> Result<(), GitClientError> {
    let guard = state.repo.lock();
    let repo = guard
        .repository
        .as_ref()
        .ok_or(GitClientError::NoRepository)?;

    let mut config = repo.config()?;
    config.set_str(&key, &value)?;

    Ok(())
}
