use serde::Serialize;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum GitClientError {
    #[error("Git error: {0}")]
    Git(#[from] git2::Error),

    #[error("No repository open")]
    NoRepository,

    #[error("Repository not found at path: {0}")]
    RepoNotFound(String),

    #[error("Invalid path: {0}")]
    InvalidPath(String),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("Lock error: {0}")]
    Lock(String),

    #[error("Operation failed: {0}")]
    Operation(String),
}

impl Serialize for GitClientError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}
