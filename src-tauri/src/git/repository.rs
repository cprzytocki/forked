use crate::error::GitClientError;
use git2::{Repository, StatusOptions};
use serde::Serialize;
use std::path::Path;

#[derive(Debug, Serialize, Clone)]
pub struct RepoInfo {
    pub path: String,
    pub name: String,
    pub is_bare: bool,
    pub head_name: Option<String>,
    pub head_oid: Option<String>,
}

#[derive(Debug, Serialize, Clone)]
pub struct FileStatus {
    pub path: String,
    pub status: String,
    pub is_staged: bool,
    pub is_modified: bool,
    pub is_new: bool,
    pub is_deleted: bool,
    pub is_renamed: bool,
    pub is_conflicted: bool,
}

#[derive(Debug, Serialize, Clone)]
pub struct RepoStatus {
    pub staged: Vec<FileStatus>,
    pub unstaged: Vec<FileStatus>,
    pub untracked: Vec<FileStatus>,
    pub conflicted: Vec<FileStatus>,
}

pub fn open_repo(path: &str) -> Result<Repository, GitClientError> {
    let path = Path::new(path);
    if !path.exists() {
        return Err(GitClientError::RepoNotFound(path.display().to_string()));
    }
    Repository::open(path).map_err(GitClientError::Git)
}

pub fn init_repo(path: &str) -> Result<Repository, GitClientError> {
    let path = Path::new(path);
    Repository::init(path).map_err(GitClientError::Git)
}

pub fn clone_repo(url: &str, path: &str) -> Result<Repository, GitClientError> {
    use crate::git::credentials::get_fetch_options;

    let path = Path::new(path);
    let mut builder = git2::build::RepoBuilder::new();
    builder.fetch_options(get_fetch_options());
    builder.clone(url, path).map_err(GitClientError::Git)
}

pub fn get_repo_info(repo: &Repository) -> Result<RepoInfo, GitClientError> {
    let path = repo
        .workdir()
        .or_else(|| repo.path().parent())
        .map(|p| p.to_string_lossy().to_string())
        .unwrap_or_default();

    let name = Path::new(&path)
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| "Unknown".to_string());

    let (head_name, head_oid) = match repo.head() {
        Ok(head) => {
            let name = head.shorthand().map(|s| s.to_string());
            let oid = head.target().map(|o| o.to_string());
            (name, oid)
        }
        Err(_) => (None, None),
    };

    Ok(RepoInfo {
        path,
        name,
        is_bare: repo.is_bare(),
        head_name,
        head_oid,
    })
}

fn format_status(status: git2::Status) -> String {
    if status.is_conflicted() {
        "conflicted".to_string()
    } else if status.is_index_new() || status.is_wt_new() {
        "new".to_string()
    } else if status.is_index_deleted() || status.is_wt_deleted() {
        "deleted".to_string()
    } else if status.is_index_renamed() || status.is_wt_renamed() {
        "renamed".to_string()
    } else if status.is_index_modified() || status.is_wt_modified() {
        "modified".to_string()
    } else if status.is_index_typechange() || status.is_wt_typechange() {
        "typechange".to_string()
    } else {
        "unknown".to_string()
    }
}

fn create_file_status(path: &str, status: git2::Status, staged: bool) -> FileStatus {
    FileStatus {
        path: path.to_string(),
        status: format_status(status),
        is_staged: staged,
        is_modified: status.is_index_modified() || status.is_wt_modified(),
        is_new: status.is_index_new() || status.is_wt_new(),
        is_deleted: status.is_index_deleted() || status.is_wt_deleted(),
        is_renamed: status.is_index_renamed() || status.is_wt_renamed(),
        is_conflicted: status.is_conflicted(),
    }
}

pub fn get_status(repo: &Repository) -> Result<RepoStatus, GitClientError> {
    let mut opts = StatusOptions::new();
    opts.include_untracked(true)
        .recurse_untracked_dirs(true)
        .include_ignored(false)
        .include_unmodified(false);

    let statuses = repo.statuses(Some(&mut opts))?;

    let mut staged = Vec::new();
    let mut unstaged = Vec::new();
    let mut untracked = Vec::new();
    let mut conflicted = Vec::new();

    for entry in statuses.iter() {
        let path = entry.path().unwrap_or("").to_string();
        let status = entry.status();

        if status.is_conflicted() {
            conflicted.push(create_file_status(&path, status, false));
            continue;
        }

        // Check for staged changes (index)
        if status.is_index_new()
            || status.is_index_modified()
            || status.is_index_deleted()
            || status.is_index_renamed()
            || status.is_index_typechange()
        {
            staged.push(create_file_status(&path, status, true));
        }

        // Check for unstaged changes (working tree)
        if status.is_wt_modified()
            || status.is_wt_deleted()
            || status.is_wt_renamed()
            || status.is_wt_typechange()
        {
            unstaged.push(create_file_status(&path, status, false));
        }

        // Check for untracked files
        if status.is_wt_new() {
            untracked.push(create_file_status(&path, status, false));
        }
    }

    Ok(RepoStatus {
        staged,
        unstaged,
        untracked,
        conflicted,
    })
}
