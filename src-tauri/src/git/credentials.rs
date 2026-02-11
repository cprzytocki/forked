use git2::{Cred, FetchOptions, PushOptions, RemoteCallbacks};
use std::cell::Cell;
use std::path::PathBuf;
use std::process::{Command, Stdio};

pub fn get_callbacks<'a>() -> RemoteCallbacks<'a> {
    let mut callbacks = RemoteCallbacks::new();

    let attempt = Cell::new(0u32);

    callbacks.credentials(move |url, username, allowed| {
        let tries = attempt.get();
        if tries >= 5 {
            return Err(git2::Error::from_str(
                "too many credential attempts — no valid credentials found",
            ));
        }
        attempt.set(tries + 1);

        let user = username.unwrap_or("git");

        if allowed.contains(git2::CredentialType::SSH_KEY) {
            // Try SSH agent first (attempt 0)
            if tries == 0 {
                if let Ok(cred) = Cred::ssh_key_from_agent(user) {
                    return Ok(cred);
                }
            }

            // Try common SSH key files from disk
            let home = dirs::home_dir().unwrap_or_else(|| PathBuf::from("~"));
            let ssh_dir = home.join(".ssh");
            let key_names = ["id_ed25519", "id_rsa", "id_ecdsa"];

            // Map attempts 1..=3 to key files (attempt 0 was ssh-agent)
            let key_index = if tries == 0 { 0 } else { tries as usize - 1 };
            if key_index < key_names.len() {
                let key_name = key_names[key_index];
                let privkey = ssh_dir.join(key_name);
                let pubkey = ssh_dir.join(format!("{}.pub", key_name));

                if privkey.exists() {
                    let pubkey_ref = if pubkey.exists() {
                        Some(pubkey.as_path())
                    } else {
                        None
                    };
                    if let Ok(cred) = Cred::ssh_key(user, pubkey_ref, &privkey, None) {
                        return Ok(cred);
                    }
                }
            }

            Err(git2::Error::from_str("no SSH credentials found"))
        } else if allowed.contains(git2::CredentialType::USER_PASS_PLAINTEXT) {
            // Try git2's built-in credential helper first
            if tries == 0 {
                if let Ok(config) = git2::Config::open_default() {
                    if let Ok(cred) = Cred::credential_helper(&config, url, username) {
                        return Ok(cred);
                    }
                }
            }

            // Fallback: shell out to `git credential fill` which properly
            // handles system credential helpers (osxkeychain, manager-core, etc.)
            let input = format!("url={}\n\n", url);
            if let Ok(output) = Command::new("git")
                .args(["credential", "fill"])
                .stdin(Stdio::piped())
                .stdout(Stdio::piped())
                .stderr(Stdio::null())
                .spawn()
                .and_then(|mut child| {
                    use std::io::Write;
                    if let Some(ref mut stdin) = child.stdin {
                        let _ = stdin.write_all(input.as_bytes());
                    }
                    child.wait_with_output()
                })
            {
                let stdout = String::from_utf8_lossy(&output.stdout);
                let mut cred_username = String::new();
                let mut cred_password = String::new();
                for line in stdout.lines() {
                    if let Some(val) = line.strip_prefix("username=") {
                        cred_username = val.to_string();
                    } else if let Some(val) = line.strip_prefix("password=") {
                        cred_password = val.to_string();
                    }
                }
                if !cred_username.is_empty() && !cred_password.is_empty() {
                    return Cred::userpass_plaintext(&cred_username, &cred_password);
                }
            }

            Err(git2::Error::from_str(
                "no credentials found — configure a Git credential helper or use SSH",
            ))
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

pub fn fetch_remote(repo: &git2::Repository, remote_name: &str) -> Result<(), git2::Error> {
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
        let mut checkout_opts = git2::build::CheckoutBuilder::default();
        repo.checkout_head(Some(&mut checkout_opts))?;

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
        &format!(
            "Merge remote-tracking branch '{}/{}'",
            remote_name, branch_name
        ),
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

pub fn is_worktree_dirty(repo: &git2::Repository) -> Result<bool, git2::Error> {
    let mut status_opts = git2::StatusOptions::new();
    status_opts.include_untracked(true).recurse_untracked_dirs(true);
    let statuses = repo.statuses(Some(&mut status_opts))?;

    Ok(statuses.iter().any(|entry| !entry.status().is_empty()))
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

    for name in remotes.iter().flatten() {
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
