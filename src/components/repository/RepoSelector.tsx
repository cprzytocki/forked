import { open } from '@tauri-apps/plugin-dialog';
import {
  Clock,
  Download,
  FolderOpen,
  FolderPlus,
  GitBranch,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { ScrollArea } from '@/components/common/ScrollArea/ScrollArea';
import { useRepoStore } from '@/stores/repoStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useUiStore } from '@/stores/uiStore';

export function RepoSelector() {
  const { openRepository } = useRepoStore();
  const { openCloneDialog, openInitDialog } = useUiStore();
  const { recentRepos, removeRecentRepo } = useSettingsStore();

  const handleOpen = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select Git Repository',
      } as const);

      if (selected) {
        await openRepository(selected);
      }
    } catch (error) {
      console.error('Failed to open repository:', error);
    }
  };

  const handleOpenRecent = async (path: string) => {
    try {
      await openRepository(path);
    } catch (error) {
      console.error('Failed to open recent repository:', error);
      removeRecentRepo(path);
    }
  };

  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-b from-background via-background to-secondary/35 p-8">
      <div className="max-w-md w-full">
        <div className="flex items-center justify-center mb-8">
          <GitBranch className="h-16 w-16 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-center mb-2">Forked</h1>
        <p className="text-muted-foreground text-center mb-8">
          A fast and beautiful Git client
        </p>

        <div className="mb-8 grid grid-cols-3 gap-4">
          <Button
            variant="outline"
            className="h-28 flex-col gap-2 rounded-xl"
            onClick={handleOpen}
          >
            <span className="rounded-full bg-secondary p-2 shadow-xs">
              <FolderOpen className="h-6 w-6" />
            </span>
            <span>Open</span>
          </Button>
          <Button
            variant="outline"
            className="h-28 flex-col gap-2 rounded-xl"
            onClick={openInitDialog}
          >
            <span className="rounded-full bg-secondary p-2 shadow-xs">
              <FolderPlus className="h-6 w-6" />
            </span>
            <span>Init</span>
          </Button>
          <Button
            variant="outline"
            className="h-28 flex-col gap-2 rounded-xl"
            onClick={openCloneDialog}
          >
            <span className="rounded-full bg-secondary p-2 shadow-xs">
              <Download className="h-6 w-6" />
            </span>
            <span>Clone</span>
          </Button>
        </div>

        {recentRepos.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Recent Repositories</span>
            </div>
            <ScrollArea className="h-48 rounded-xl border border-border/50 bg-card/70 shadow-xs">
              {recentRepos.map((path) => (
                <button
                  type="button"
                  key={path}
                  className="group flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left transition-colors duration-100 hover:bg-accent/50"
                  onClick={() => handleOpenRecent(path)}
                >
                  <FolderOpen className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1 text-sm truncate">{path}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 transition-opacity duration-100 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeRecentRepo(path);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </button>
              ))}
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
}
