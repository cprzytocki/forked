import { Archive, Copy, Play, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/common/Button';
import { Dialog } from '@/components/common/Dialog/Dialog';
import { DialogContent } from '@/components/common/Dialog/DialogContent';
import { DialogDescription } from '@/components/common/Dialog/DialogDescription';
import { DialogFooter } from '@/components/common/Dialog/DialogFooter';
import { DialogHeader } from '@/components/common/Dialog/DialogHeader';
import { DialogTitle } from '@/components/common/Dialog/DialogTitle';
import { Input } from '@/components/common/Input';
import { ScrollArea } from '@/components/common/ScrollArea/ScrollArea';
import { useRepoStore } from '@/stores/repoStore';
import { useUiStore } from '@/stores/uiStore';

export function StashDialog() {
  const { stashes, stashSave, stashPop, stashApply, stashDrop } =
    useRepoStore();
  const { isStashDialogOpen, closeStashDialog } = useUiStore();
  const [message, setMessage] = useState('');

  const handleSave = async () => {
    await stashSave(message || undefined);
    setMessage('');
  };

  return (
    <Dialog open={isStashDialogOpen} onOpenChange={closeStashDialog}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Stash</DialogTitle>
          <DialogDescription>
            Save and restore work in progress
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label
              htmlFor="stash-message"
              className="block text-sm font-medium"
            >
              <span className="mb-1.5 block">New Stash</span>
              <div className="flex gap-2">
                <Input
                  id="stash-message"
                  placeholder="Optional message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleSave}>
                  <Archive className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </div>
            </label>
          </div>

          {stashes.length > 0 && (
            <div className="space-y-2">
              <span className="text-sm font-medium">Saved Stashes</span>
              <ScrollArea className="h-48 rounded-lg border border-border/40">
                {stashes.map((stash) => (
                  <div
                    key={stash.index}
                    className="group mx-1 flex items-center gap-2 rounded-md px-3 py-2 transition-colors duration-100 hover:bg-accent/50"
                  >
                    <span className="text-xs text-muted-foreground font-mono">
                      stash@{`{${stash.index}}`}
                    </span>
                    <span className="flex-1 text-sm truncate">
                      {stash.message}
                    </span>
                    <div className="flex items-center gap-1 opacity-0 transition-opacity duration-100 group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => stashPop(stash.index)}
                        title="Pop (apply and drop)"
                      >
                        <Play className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => stashApply(stash.index)}
                        title="Apply (keep stash)"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive"
                        onClick={() => stashDrop(stash.index)}
                        title="Drop"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={closeStashDialog}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
