import { open } from '@tauri-apps/plugin-dialog';
import { FolderOpen, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/common/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/common/Dialog';
import { Input } from '@/components/common/Input';
import { useRepoStore } from '@/stores/repoStore';
import { useUiStore } from '@/stores/uiStore';

export function InitDialog() {
  const { initRepository, isLoading } = useRepoStore();
  const { isInitDialogOpen, closeInitDialog } = useUiStore();
  const [path, setPath] = useState('');

  const handleSelectPath = async () => {
    const selected = await open({
      directory: true,
      multiple: false,
      title: 'Select Location for New Repository',
    } as const);

    if (selected) {
      setPath(selected);
    }
  };

  const handleInit = async () => {
    if (path) {
      await initRepository(path);
      closeInitDialog();
      setPath('');
    }
  };

  return (
    <Dialog open={isInitDialogOpen} onOpenChange={closeInitDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Initialize Repository</DialogTitle>
          <DialogDescription>
            Create a new Git repository in the selected folder
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="init-path" className="text-sm font-medium">
              Location
              <div className="flex gap-2">
                <Input
                  id="init-path"
                  placeholder="Select a folder..."
                  value={path}
                  onChange={(e) => setPath(e.target.value)}
                  className="flex-1"
                />
                <Button variant="outline" onClick={handleSelectPath}>
                  <FolderOpen className="h-4 w-4" />
                </Button>
              </div>
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={closeInitDialog}>
            Cancel
          </Button>
          <Button onClick={handleInit} disabled={!path || isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Initializing...
              </>
            ) : (
              'Initialize'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
