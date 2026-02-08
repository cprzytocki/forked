use notify::RecursiveMode;
use notify_debouncer_mini::{new_debouncer, DebouncedEventKind, Debouncer};
use std::path::{Path, PathBuf};
use std::sync::mpsc;
use std::time::Duration;
use tauri::{AppHandle, Emitter};

pub struct RepoWatcher {
    _debouncer: Debouncer<notify::RecommendedWatcher>,
    _thread: std::thread::JoinHandle<()>,
}

fn should_emit_for_path(path: &Path, repo_root: &Path) -> bool {
    let git_dir = repo_root.join(".git");
    if let Ok(relative) = path.strip_prefix(&git_dir) {
        let rel_str = relative.to_string_lossy();
        rel_str.starts_with("HEAD") || rel_str.starts_with("refs") || rel_str == "index"
    } else {
        // Outside .git/ — always emit
        true
    }
}

impl RepoWatcher {
    pub fn start(repo_path: PathBuf, app_handle: AppHandle) -> Result<Self, String> {
        let (tx, rx) = mpsc::channel();

        let mut debouncer = new_debouncer(Duration::from_millis(500), tx)
            .map_err(|e| format!("Failed to create file watcher: {e}"))?;

        debouncer
            .watcher()
            .watch(&repo_path, RecursiveMode::Recursive)
            .map_err(|e| format!("Failed to watch path: {e}"))?;

        let repo_root = repo_path.clone();
        let thread = std::thread::spawn(move || {
            while let Ok(result) = rx.recv() {
                match result {
                    Ok(events) => {
                        let dominated_by_any_real_change = events.iter().any(|event| {
                            event.kind == DebouncedEventKind::Any
                                && should_emit_for_path(&event.path, &repo_root)
                        });
                        if dominated_by_any_real_change {
                            let _ = app_handle.emit("repo-changed", ());
                        }
                    }
                    Err(e) => {
                        eprintln!("File watcher error: {e}");
                    }
                }
            }
        });

        Ok(Self {
            _debouncer: debouncer,
            _thread: thread,
        })
    }
}
