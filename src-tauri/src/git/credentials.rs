use git2::{Cred, FetchOptions, PushOptions, RemoteCallbacks};

pub fn get_callbacks<'a>() -> RemoteCallbacks<'a> {
    let mut callbacks = RemoteCallbacks::new();

    callbacks.credentials(|_url, username, allowed| {
        if allowed.contains(git2::CredentialType::SSH_KEY) {
            let user = username.unwrap_or("git");
            // Try SSH agent first
            Cred::ssh_key_from_agent(user)
        } else if allowed.contains(git2::CredentialType::USER_PASS_PLAINTEXT) {
            // Fallback to credential helper or default
            Cred::credential_helper(
                &git2::Config::open_default()?,
                _url,
                username,
            )
        } else if allowed.contains(git2::CredentialType::DEFAULT) {
            Cred::default()
        } else {
            Err(git2::Error::from_str("no valid credential type"))
        }
    });

    callbacks.push_update_reference(|refname, status| {
        if let Some(msg) = status {
            return Err(git2::Error::from_str(&format!(
                "Failed to push {}: {}",
                refname, msg
            )));
        }
        Ok(())
    });

    callbacks
}

pub fn get_fetch_options<'a>() -> FetchOptions<'a> {
    let mut fetch_opts = FetchOptions::new();
    fetch_opts.remote_callbacks(get_callbacks());
    fetch_opts
}

pub fn get_push_options<'a>() -> PushOptions<'a> {
    let mut push_opts = PushOptions::new();
    push_opts.remote_callbacks(get_callbacks());
    push_opts
}

pub fn fetch_remote(
    repo: &git2::Repository,
    remote_name: &str,
) -> Result<(), git2::Error> {
    let mut remote = repo.find_remote(remote_name)?;
    let refspecs: Vec<String> = remote
        .fetch_refspecs()?
        .iter()
        .filter_map(|s| s.map(|s| s.to_string()))
        .collect();

    let refspec_strs: Vec<&str> = refspecs.iter().map(|s| s.as_str()).collect();

    remote.fetch(&refspec_strs, Some(&mut get_fetch_options()), None)?;
    Ok(())
}

pub fn push_remote(
    repo: &git2::Repository,
    remote_name: &str,
    branch_name: &str,
) -> Result<(), git2::Error> {
    let mut remote = repo.find_remote(remote_name)?;
    let refspec = format!("refs/heads/{}:refs/heads/{}", branch_name, branch_name);

    remote.push(&[&refspec], Some(&mut get_push_options()))?;
    Ok(())
}

pub fn pull_remote(
    repo: &git2::Repository,
    remote_name: &str,
    branch_name: &str,
) -> Result<PullResult, git2::Error> {
    // First fetch
    fetch_remote(repo, remote_name)?;

    // Get the fetch head
    let fetch_head = repo.find_reference("FETCH_HEAD")?;
    let fetch_commit = repo.reference_to_annotated_commit(&fetch_head)?;

    let (analysis, _) = repo.merge_analysis(&[&fetch_commit])?;

    if analysis.is_up_to_date() {
        return Ok(PullResult {
            success: true,
            fast_forward: false,
            conflicts: Vec::new(),
            message: "Already up to date".to_string(),
        });
    }

    if analysis.is_fast_forward() {
        let refname = format!("refs/heads/{}", branch_name);
        let mut reference = repo.find_reference(&refname)?;
        reference.set_target(fetch_commit.id(), "Fast-forward pull")?;
        repo.checkout_head(Some(git2::build::CheckoutBuilder::default().force()))?;

        return Ok(PullResult {
            success: true,
            fast_forward: true,
            conflicts: Vec::new(),
            message: format!("Fast-forward to {}", fetch_commit.id()),
        });
    }

    // Normal merge
    repo.merge(&[&fetch_commit], None, None)?;

    let index = repo.index()?;
    let conflicts: Vec<String> = index
        .conflicts()?
        .filter_map(|c| c.ok())
        .filter_map(|c| {
            c.our
                .or(c.their)
                .or(c.ancestor)
                .and_then(|e| String::from_utf8(e.path.clone()).ok())
        })
        .collect();

    if !conflicts.is_empty() {
        let message = format!("Merge conflicts in {} files", conflicts.len());
        return Ok(PullResult {
            success: false,
            fast_forward: false,
            conflicts,
            message,
        });
    }

    // Auto-commit
    let mut index = repo.index()?;
    let tree_id = index.write_tree()?;
    let tree = repo.find_tree(tree_id)?;
    let signature = repo.signature()?;

    let head_commit = repo.head()?.peel_to_commit()?;
    let fetch_commit_obj = repo.find_commit(fetch_commit.id())?;

    repo.commit(
        Some("HEAD"),
        &signature,
        &signature,
        &format!("Merge remote-tracking branch '{}/{}'", remote_name, branch_name),
        &tree,
        &[&head_commit, &fetch_commit_obj],
    )?;

    repo.cleanup_state()?;

    Ok(PullResult {
        success: true,
        fast_forward: false,
        conflicts: Vec::new(),
        message: "Pull completed with merge".to_string(),
    })
}

use serde::Serialize;

#[derive(Debug, Serialize, Clone)]
pub struct PullResult {
    pub success: bool,
    pub fast_forward: bool,
    pub conflicts: Vec<String>,
    pub message: String,
}

#[derive(Debug, Serialize, Clone)]
pub struct RemoteInfo {
    pub name: String,
    pub url: String,
    pub push_url: Option<String>,
}

pub fn list_remotes(repo: &git2::Repository) -> Result<Vec<RemoteInfo>, git2::Error> {
    let remotes = repo.remotes()?;
    let mut result = Vec::new();

    for name in remotes.iter().filter_map(|n| n) {
        if let Ok(remote) = repo.find_remote(name) {
            result.push(RemoteInfo {
                name: name.to_string(),
                url: remote.url().unwrap_or("").to_string(),
                push_url: remote.pushurl().map(|s| s.to_string()),
            });
        }
    }

    Ok(result)
}
