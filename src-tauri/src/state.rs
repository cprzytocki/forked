use git2::Repository;
use parking_lot::Mutex;
use std::path::PathBuf;

pub struct RepoState {
    pub repository: Option<Repository>,
    pub path: Option<PathBuf>,
}

pub struct AppState {
    pub repo: Mutex<RepoState>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            repo: Mutex::new(RepoState {
                repository: None,
                path: None,
            }),
        }
    }

    pub fn set_repository(&self, repo: Repository, path: PathBuf) {
        let mut guard = self.repo.lock();
        guard.repository = Some(repo);
        guard.path = Some(path);
    }

    pub fn clear_repository(&self) {
        let mut guard = self.repo.lock();
        guard.repository = None;
        guard.path = None;
    }

    pub fn get_repo_path(&self) -> Option<PathBuf> {
        self.repo.lock().path.clone()
    }
}

impl Default for AppState {
    fn default() -> Self {
        Self::new()
    }
}
