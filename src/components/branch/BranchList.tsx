import { Check, Cloud, GitBranch, GitMerge, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { ScrollArea } from '@/components/common/ScrollArea';
import type { BranchInfo } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useRepoStore } from '@/stores/repoStore';
import { useUiStore } from '@/stores/uiStore';

interface BranchItemProps {
  branch: BranchInfo;
  onCheckout: () => void;
  onDelete: () => void;
  onMerge: () => void;
}

function BranchItem({
  branch,
  onCheckout,
  onDelete,
  onMerge,
}: BranchItemProps) {
  return (
    <button
      type="button"
      className={cn(
        'group flex items-center gap-2 px-3 py-2 hover:bg-accent cursor-pointer w-full text-left',
        branch.is_head && 'bg-accent',
      )}
      onClick={onCheckout}
    >
      {branch.is_remote ? (
        <Cloud className="h-4 w-4 text-muted-foreground" />
      ) : (
        <GitBranch className="h-4 w-4 text-muted-foreground" />
      )}
      <span className="flex-1 text-sm truncate">{branch.name}</span>
      {branch.is_head && <Check className="h-4 w-4 text-green-500" />}
      {!branch.is_head && !branch.is_remote && (
        <div className="hidden group-hover:flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              onMerge();
            }}
            title="Merge into current branch"
            aria-label="Merge into current branch"
          >
            <GitMerge className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Delete branch"
            aria-label="Delete branch"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}
    </button>
  );
}

export function BranchList() {
  const { branches, checkoutBranch, deleteBranch, mergeBranch } =
    useRepoStore();
  const { openCreateBranchDialog } = useUiStore();

  const localBranches = branches.filter((b) => !b.is_remote);
  const remoteBranches = branches.filter((b) => b.is_remote);

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4" />
          <span className="font-semibold text-sm">Branches</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={openCreateBranchDialog}
          title="Create branch"
          aria-label="Create branch"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        {localBranches.length > 0 && (
          <div className="py-2">
            <div className="px-3 py-1 text-xs font-medium text-muted-foreground">
              Local
            </div>
            {localBranches.map((branch) => (
              <BranchItem
                key={branch.name}
                branch={branch}
                onCheckout={() => checkoutBranch(branch.name)}
                onDelete={() => deleteBranch(branch.name)}
                onMerge={() => mergeBranch(branch.name)}
              />
            ))}
          </div>
        )}
        {remoteBranches.length > 0 && (
          <div className="py-2 border-t">
            <div className="px-3 py-1 text-xs font-medium text-muted-foreground">
              Remote
            </div>
            {remoteBranches.map((branch) => (
              <BranchItem
                key={branch.name}
                branch={branch}
                onCheckout={() => checkoutBranch(branch.name)}
                onDelete={() => {}}
                onMerge={() => {}}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
