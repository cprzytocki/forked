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
      await pull(defaultRemote, currentBranch);
    }
  };

  const handlePush = async () => {
    if (currentBranch) {
      await push(defaultRemote, currentBranch);
    }
  };

  return (
    <header className="flex h-12 items-center gap-4 border-b border-border/40 bg-background/80 px-4 shadow-xs backdrop-blur-md">
      <div className="flex items-center gap-2">
        <GitFork className="h-5 w-5 text-primary" />
        <span className="font-semibold">{repoInfo?.name || 'Forked'}</span>
      </div>

      {repoInfo && (
        <>
          <div className="ml-4 flex items-center gap-1 rounded-full border border-border/50 bg-card/70 p-0.5 shadow-xs">
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

          <div className="ml-2 flex items-center gap-1 rounded-full border border-border/50 bg-card/70 p-0.5 shadow-xs">
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

      <div className="flex items-center gap-1 rounded-full border border-border/50 bg-card/70 p-0.5 shadow-xs">
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
