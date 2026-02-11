import { ChevronDown } from 'lucide-react';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { BranchOption } from '@/components/branch/BranchOption';
import { Button } from '@/components/common/Button';
import { Dialog } from '@/components/common/Dialog/Dialog';
import { DialogContent } from '@/components/common/Dialog/DialogContent';
import { DialogDescription } from '@/components/common/Dialog/DialogDescription';
import { DialogFooter } from '@/components/common/Dialog/DialogFooter';
import { DialogHeader } from '@/components/common/Dialog/DialogHeader';
import { DialogTitle } from '@/components/common/Dialog/DialogTitle';
import { Input } from '@/components/common/Input';
import { cn } from '@/lib/utils';
import { useRepoStore } from '@/stores/repoStore';
import { useUiStore } from '@/stores/uiStore';

export function CreateBranchDialog() {
  const { createBranch, branches, currentBranch } = useRepoStore();
  const { isCreateBranchDialogOpen, closeCreateBranchDialog } = useUiStore();
  const [name, setName] = useState('');
  const [sourceBranch, setSourceBranch] = useState('');
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selectorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selectorOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        selectorRef.current &&
        !selectorRef.current.contains(e.target as Node)
      ) {
        setSelectorOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectorOpen]);

  const localBranches = branches.filter((b) => !b.is_remote);
  const remoteBranches = branches.filter((b) => b.is_remote);

  useEffect(() => {
    if (isCreateBranchDialogOpen && currentBranch) {
      setSourceBranch(currentBranch);
    }
  }, [isCreateBranchDialogOpen, currentBranch]);

  const handleCreate = async () => {
    if (name) {
      await createBranch(name, sourceBranch || undefined);
      closeCreateBranchDialog();
      setName('');
      setSourceBranch('');
      setSearch('');
      setSelectorOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreate();
    }
  };

  const filteredLocal = localBranches.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase()),
  );
  const filteredRemote = remoteBranches.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Dialog
      open={isCreateBranchDialogOpen}
      onOpenChange={(open) => {
        if (!open) {
          closeCreateBranchDialog();
          setSelectorOpen(false);
          setSearch('');
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Branch</DialogTitle>
          <DialogDescription>
            Create a new branch from an existing branch
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="branch-name" className="text-sm font-medium">
              Branch Name
              <Input
                id="branch-name"
                placeholder="feature/my-branch"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
              />
            </label>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Source Branch
              <div className="relative" ref={selectorRef}>
                <button
                  type="button"
                  onClick={() => setSelectorOpen(!selectorOpen)}
                  className={cn(
                    'flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors',
                    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                  )}
                >
                  <span className="truncate">
                    {sourceBranch || 'Select branch...'}
                  </span>
                  <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                </button>
                {selectorOpen && (
                  <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-md">
                    <div className="p-1">
                      <input
                        type="text"
                        placeholder="Search branches..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="flex h-8 w-full rounded-sm bg-transparent px-2 py-1 text-sm outline-none placeholder:text-muted-foreground"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto p-1">
                      {filteredLocal.length === 0 &&
                      filteredRemote.length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          No branches found
                        </div>
                      ) : (
                        <>
                          {filteredLocal.length > 0 && (
                            <>
                              <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                                Local
                              </div>
                              {filteredLocal.map((branch) => (
                                <BranchOption
                                  key={branch.name}
                                  name={branch.name}
                                  selected={sourceBranch === branch.name}
                                  onSelect={() => {
                                    setSourceBranch(branch.name);
                                    setSelectorOpen(false);
                                    setSearch('');
                                  }}
                                />
                              ))}
                            </>
                          )}
                          {filteredRemote.length > 0 && (
                            <>
                              <div className="px-2 py-1 text-xs font-semibold text-muted-foreground mt-1">
                                Remote
                              </div>
                              {filteredRemote.map((branch) => (
                                <BranchOption
                                  key={branch.name}
                                  name={branch.name}
                                  selected={sourceBranch === branch.name}
                                  onSelect={() => {
                                    setSourceBranch(branch.name);
                                    setSelectorOpen(false);
                                    setSearch('');
                                  }}
                                />
                              ))}
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={closeCreateBranchDialog}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!name}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
