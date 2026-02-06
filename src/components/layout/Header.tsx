import { useRepoStore } from "@/stores/repoStore";
import { useUiStore } from "@/stores/uiStore";
import { Button } from "@/components/common/Button";
import {
  GitBranch,
  RefreshCw,
  Download,
  Upload,
  FolderOpen,
  Moon,
  Sun,
  Archive,
  Loader2,
} from "lucide-react";

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

  const defaultRemote = remotes[0]?.name || "origin";

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
    <header className="h-12 border-b flex items-center px-4 gap-4 bg-background">
      <div className="flex items-center gap-2">
        <GitBranch className="h-5 w-5 text-primary" />
        <span className="font-semibold">
          {repoInfo?.name || "Git Client"}
        </span>
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
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePush}
              disabled={isLoading || !currentBranch || remotes.length === 0}
              title="Push"
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
          >
            <FolderOpen className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          title="Toggle theme"
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>
      </div>
    </header>
  );
}
