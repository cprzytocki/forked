import { useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { useRepoStore } from "@/stores/repoStore";
import { useUiStore } from "@/stores/uiStore";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/common/Dialog";
import { FolderOpen, Loader2 } from "lucide-react";

export function CloneDialog() {
  const { cloneRepository, isLoading } = useRepoStore();
  const { isCloneDialogOpen, closeCloneDialog } = useUiStore();
  const [url, setUrl] = useState("");
  const [path, setPath] = useState("");

  const handleSelectPath = async () => {
    const selected = await open({
      directory: true,
      multiple: false,
      title: "Select Clone Location",
    });

    if (selected) {
      setPath(selected as string);
    }
  };

  const handleClone = async () => {
    if (url && path) {
      await cloneRepository(url, path);
      closeCloneDialog();
      setUrl("");
      setPath("");
    }
  };

  return (
    <Dialog open={isCloneDialogOpen} onOpenChange={closeCloneDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Clone Repository</DialogTitle>
          <DialogDescription>
            Enter the URL of the repository you want to clone
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Repository URL</label>
            <Input
              placeholder="https://github.com/user/repo.git"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Clone to</label>
            <div className="flex gap-2">
              <Input
                placeholder="Select a folder..."
                value={path}
                onChange={(e) => setPath(e.target.value)}
                className="flex-1"
              />
              <Button variant="outline" onClick={handleSelectPath}>
                <FolderOpen className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={closeCloneDialog}>
            Cancel
          </Button>
          <Button onClick={handleClone} disabled={!url || !path || isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Cloning...
              </>
            ) : (
              "Clone"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
