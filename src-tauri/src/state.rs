use git2::Repository;
use parking_lot::Mutex;
use std::path::PathBuf;

pub struct AppState {
    pub repository: Mutex<Option<Repository>>,
    pub repo_path: Mutex<Option<PathBuf>>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            repository: Mutex::new(None),
            repo_path: Mutex::new(None),
        }
    }

    pub fn set_repository(&self, repo: Repository, path: PathBuf) {
        *self.repository.lock() = Some(repo);
        *self.repo_path.lock() = Some(path);
    }

    pub fn clear_repository(&self) {
        *self.repository.lock() = None;
        *self.repo_path.lock() = None;
    }

    pub fn get_repo_path(&self) -> Option<PathBuf> {
        self.repo_path.lock().clone()
    }
}

impl Default for AppState {
    fn default() -> Self {
        Self::new()
    }
}
