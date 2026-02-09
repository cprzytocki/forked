use crate::error::GitClientError;
use git2::{Oid, Repository, ResetType};
use std::path::Path;

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
    let mut checkout_opts = git2::build::CheckoutBuilder::new();
    checkout_opts.path(path);
    checkout_opts.force();

    repo.checkout_head(Some(&mut checkout_opts))?;
    Ok(())
}

pub fn discard_all_changes(repo: &Repository) -> Result<(), GitClientError> {
    let mut checkout_opts = git2::build::CheckoutBuilder::new();
    checkout_opts.force();

    repo.checkout_head(Some(&mut checkout_opts))?;
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
