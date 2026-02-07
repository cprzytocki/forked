pub mod commands;
pub mod error;
pub mod git;
pub mod state;
pub mod watcher;

use state::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .manage(AppState::new())
        .invoke_handler(tauri::generate_handler![
            // Repository commands
            commands::open_repository,
            commands::init_repository,
            commands::clone_repository,
            commands::get_status,
            commands::get_repo_info,
            commands::close_repository,
            commands::get_current_repo_path,
            // Staging/commit commands
            commands::stage_file,
            commands::unstage_file,
            commands::stage_all,
            commands::unstage_all,
            commands::discard_changes,
            commands::discard_all_changes,
            commands::create_commit,
            commands::get_commit_history,
            commands::get_commit_history_with_graph,
            commands::get_commit_details,
            // Branch commands
            commands::list_branches,
            commands::create_branch,
            commands::checkout_branch,
            commands::delete_branch,
            commands::merge_branch,
            // Remote commands
            commands::fetch,
            commands::pull,
            commands::push,
            commands::list_remotes,
            // Diff commands
            commands::get_file_diff,
            commands::get_commit_diff,
            // Stash commands
            commands::stash_save,
            commands::stash_pop,
            commands::stash_apply,
            commands::stash_drop,
            commands::stash_list,
            // Config commands
            commands::get_git_config,
            commands::set_git_config,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
