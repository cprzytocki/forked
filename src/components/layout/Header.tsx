import {
  Archive,
  Download,
  FolderOpen,
  GitFork,
  Loader2,
  Moon,
  RefreshCw,
  Sun,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { useRepoStore } from '@/stores/repoStore';
import { useUiStore } from '@/stores/uiStore';

export function Header() {
  const {
    repoInfo,
    currentBranch,
    status,
    remotes,
    isLoading,
    closeRepository,
    fetch,
    pull,
    push,
  } = useRepoStore();
  const { theme, toggleTheme, openStashDialog } = useUiStore();

  const defaultRemote = remotes[0]?.name || 'origin';

  const handleFetch = async () => {
    await fetch(defaultRemote);
  };

  const handlePull = async () => {
    if (currentBranch) {
      const hasLocalChanges = Boolean(
        status &&
          (status.staged.length > 0 ||
            status.unstaged.length > 0 ||
            status.untracked.length > 0 ||
            status.conflicted.length > 0),
      );

      if (hasLocalChanges) {
        const shouldAutoStash = window.confirm(
          'You have uncommitted changes. Auto-stash, pull, then restore changes?',
        );
        if (!shouldAutoStash) {
          return;
        }
        await pull(defaultRemote, currentBranch, true);
        return;
      }

      await pull(defaultRemote, currentBranch, false);
    }
  };

  const handlePush = async () => {
    if (currentBranch) {
      await push(defaultRemote, currentBranch);
    }
  };

  return (
    <header className="h-12 border-b flex items-center px-4 gap-4 bg-background">
      <div className="flex items-center gap-2">
        <GitFork className="h-5 w-5 text-primary" />
        <span className="font-semibold">{repoInfo?.name || 'Forked'}</span>
      </div>

      {repoInfo && (
        <>
          <div className="flex items-center gap-1 ml-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFetch}
              disabled={isLoading || remotes.length === 0}
              title="Fetch"
              aria-label="Fetch"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePull}
              disabled={isLoading || !currentBranch || remotes.length === 0}
              title="Pull"
              aria-label="Pull"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePush}
              disabled={isLoading || !currentBranch || remotes.length === 0}
              title="Push"
              aria-label="Push"
            >
              <Upload className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-1 ml-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={openStashDialog}
              title="Stash"
              aria-label="Stash"
            >
              <Archive className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}

      <div className="flex-1" />

      <div className="flex items-center gap-1">
        {repoInfo && (
          <Button
            variant="ghost"
            size="sm"
            onClick={closeRepository}
            title="Close repository"
            aria-label="Close repository"
          >
            <FolderOpen className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          title="Toggle theme"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>
      </div>
    </header>
  );
}
