import { open } from "@tauri-apps/plugin-dialog";
import { useRepoStore } from "@/stores/repoStore";
import { useUiStore } from "@/stores/uiStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { Button } from "@/components/common/Button";
import { ScrollArea } from "@/components/common/ScrollArea";
import { FolderOpen, FolderPlus, Download, Clock, Trash2, GitBranch } from "lucide-react";

export function RepoSelector() {
  const { openRepository } = useRepoStore();
  const { openCloneDialog, openInitDialog } = useUiStore();
  const { recentRepos, removeRecentRepo } = useSettingsStore();

  const handleOpen = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: "Select Git Repository",
      } as const);

      if (selected) {
        await openRepository(selected);
      }
    } catch (error) {
      console.error("Failed to open repository:", error);
    }
  };

  const handleOpenRecent = async (path: string) => {
    try {
      await openRepository(path);
    } catch (error) {
      console.error("Failed to open recent repository:", error);
      removeRecentRepo(path);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <div className="max-w-md w-full">
        <div className="flex items-center justify-center mb-8">
          <GitBranch className="h-16 w-16 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-center mb-2">Git Client</h1>
        <p className="text-muted-foreground text-center mb-8">
          A fast and beautiful Git client
        </p>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <Button
            variant="outline"
            className="h-24 flex flex-col gap-2"
            onClick={handleOpen}
          >
            <FolderOpen className="h-8 w-8" />
            <span>Open</span>
          </Button>
          <Button
            variant="outline"
            className="h-24 flex flex-col gap-2"
            onClick={openInitDialog}
          >
            <FolderPlus className="h-8 w-8" />
            <span>Init</span>
          </Button>
          <Button
            variant="outline"
            className="h-24 flex flex-col gap-2"
            onClick={openCloneDialog}
          >
            <Download className="h-8 w-8" />
            <span>Clone</span>
          </Button>
        </div>

        {recentRepos.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Recent Repositories</span>
            </div>
            <ScrollArea className="h-48 border rounded-md">
              {recentRepos.map((path) => (
                <div
                  key={path}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-accent cursor-pointer group"
                  role="button"
                  tabIndex={0}
                  onClick={() => handleOpenRecent(path)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleOpenRecent(path);
                    }
                  }}
                >
                  <FolderOpen className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1 text-sm truncate">{path}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeRecentRepo(path);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
}
