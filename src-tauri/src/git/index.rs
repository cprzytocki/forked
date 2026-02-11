use crate::error::GitClientError;
use git2::{Oid, Repository, ResetType, StatusOptions};
use std::path::{Component, Path};

pub fn stage_file(repo: &Repository, path: &str) -> Result<(), GitClientError> {
    let mut index = repo.index()?;

    let file_path = Path::new(path);
    let workdir = repo.workdir().ok_or(GitClientError::NoRepository)?;
    let full_path = workdir.join(file_path);

    if full_path.exists() {
        index.add_path(file_path)?;
    } else {
        // File was deleted, remove from index
        index.remove_path(file_path)?;
    }

    index.write()?;
    Ok(())
}

pub fn unstage_file(repo: &Repository, path: &str) -> Result<(), GitClientError> {
    let head = repo.head()?;
    let head_commit = head.peel_to_commit()?;

    repo.reset_default(Some(&head_commit.into_object()), [Path::new(path)])?;

    Ok(())
}

pub fn stage_all(repo: &Repository) -> Result<(), GitClientError> {
    let mut index = repo.index()?;
    index.add_all(["*"].iter(), git2::IndexAddOption::DEFAULT, None)?;
    index.write()?;
    Ok(())
}

pub fn unstage_all(repo: &Repository) -> Result<(), GitClientError> {
    let head = repo.head()?;
    let head_commit = head.peel_to_commit()?;

    repo.reset(&head_commit.into_object(), git2::ResetType::Mixed, None)?;

    Ok(())
}

pub fn discard_changes(repo: &Repository, path: &str) -> Result<(), GitClientError> {
    let relative_path = validate_relative_path(path)?;
    let status = repo
        .status_file(relative_path)
        .unwrap_or_else(|_| git2::Status::empty());

    if status.is_index_new() || status.is_wt_new() {
        if status.is_index_new() {
            let mut index = repo.index()?;
            match index.remove_path(relative_path) {
                Ok(()) => {}
                Err(err) if err.code() == git2::ErrorCode::NotFound => {}
                Err(err) => return Err(err.into()),
            }
            index.write()?;
        }

        if status.is_wt_new() {
            let workdir = repo.workdir().ok_or(GitClientError::NoRepository)?;
            remove_workdir_path(workdir, relative_path)?;
        }

        return Ok(());
    }

    let mut checkout_opts = git2::build::CheckoutBuilder::new();
    checkout_opts.path(relative_path);
    checkout_opts.force();
    checkout_opts.remove_untracked(true);

    repo.checkout_head(Some(&mut checkout_opts))?;
    Ok(())
}

pub fn discard_all_changes(repo: &Repository) -> Result<(), GitClientError> {
    if repo.head().is_err() {
        // Repos without HEAD (e.g. unborn branch) still need untracked cleanup.
        let workdir = repo.workdir().ok_or(GitClientError::NoRepository)?;
        let mut status_opts = StatusOptions::new();
        status_opts
            .include_untracked(true)
            .recurse_untracked_dirs(true)
            .include_unmodified(false)
            .include_ignored(false);

        let statuses = repo.statuses(Some(&mut status_opts))?;
        for entry in statuses.iter() {
            if entry.status().is_wt_new() {
                if let Some(path) = entry.path() {
                    let relative_path = validate_relative_path(path)?;
                    remove_workdir_path(workdir, relative_path)?;
                }
            }
        }

        return Ok(());
    }

    let mut checkout_opts = git2::build::CheckoutBuilder::new();
    checkout_opts.force();
    checkout_opts.remove_untracked(true);

    repo.checkout_head(Some(&mut checkout_opts))?;
    Ok(())
}

fn validate_relative_path(path: &str) -> Result<&Path, GitClientError> {
    let relative_path = Path::new(path);
    if relative_path.is_absolute() {
        return Err(GitClientError::InvalidPath(path.to_string()));
    }

    if relative_path
        .components()
        .any(|component| matches!(component, Component::ParentDir | Component::RootDir))
    {
        return Err(GitClientError::InvalidPath(path.to_string()));
    }

    Ok(relative_path)
}

fn remove_workdir_path(workdir: &Path, relative_path: &Path) -> Result<(), GitClientError> {
    let full_path = workdir.join(relative_path);
    if !full_path.exists() {
        return Ok(());
    }

    let metadata = std::fs::symlink_metadata(&full_path)?;
    if metadata.file_type().is_dir() {
        std::fs::remove_dir_all(full_path)?;
    } else {
        std::fs::remove_file(full_path)?;
    }

    Ok(())
}

pub fn reset_to_commit(
    repo: &Repository,
    commit_id: &str,
    mode: &str,
) -> Result<(), GitClientError> {
    let oid = Oid::from_str(commit_id)
        .map_err(|e| GitClientError::Operation(format!("Invalid commit ID: {}", e)))?;
    let commit = repo.find_commit(oid)?;
    let object = commit.into_object();

    let reset_type = match mode {
        "soft" => ResetType::Soft,
        "hard" => ResetType::Hard,
        _ => {
            return Err(GitClientError::Operation(format!(
                "Invalid reset mode: {}. Expected 'soft' or 'hard'.",
                mode
            )))
        }
    };

    repo.reset(&object, reset_type, None)?;
    Ok(())
}
