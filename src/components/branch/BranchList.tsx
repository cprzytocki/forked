import { ArrowRight, Check, ChevronDown, ChevronRight, Cloud, GitBranch, GitMerge, Plus, Star, Trash2 } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ScrollArea } from '@/components/common/ScrollArea';
import type { BranchInfo } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useRepoStore } from '@/stores/repoStore';
import { useUiStore } from '@/stores/uiStore';

interface BranchItemProps {
  branch: BranchInfo;
  isViewing: boolean;
  onSelect: () => void;
  onCheckout: () => void;
  onDelete: () => void;
  onMerge: () => void;
}

function BranchItem({
  branch,
  isViewing,
  onSelect,
  onCheckout,
  onDelete,
  onMerge,
}: BranchItemProps) {
  return (
    <button
      type="button"
      className={cn(
        'group flex items-center gap-2 px-2 py-1.5 hover:bg-accent cursor-pointer w-full text-left',
        branch.is_head && 'bg-accent',
        isViewing && !branch.is_head && 'bg-accent/50',
      )}
      onClick={onSelect}
    >
      {branch.is_remote ? (
        <Cloud className="h-4 w-4 text-muted-foreground" />
      ) : (
        <GitBranch className="h-4 w-4 text-muted-foreground" />
      )}
      <span className="flex-1 text-sm truncate">
        {branch.name}
        {branch.is_default && <Star className="inline h-3 w-3 ml-1 text-yellow-500 fill-yellow-500 align-middle" />}
      </span>
      {branch.ahead != null && branch.ahead > 0 && (
        <span className="font-mono text-xs shrink-0 text-git-added" title={`${branch.ahead} commit${branch.ahead === 1 ? '' : 's'} ahead of upstream (to push)`}>
          ↑{branch.ahead}
        </span>
      )}
      {branch.behind != null && branch.behind > 0 && (
        <span className="font-mono text-xs shrink-0 text-git-renamed" title={`${branch.behind} commit${branch.behind === 1 ? '' : 's'} behind upstream (to pull)`}>
          ↓{branch.behind}
        </span>
      )}
      {branch.is_head && <Check className="h-4 w-4 text-green-500" />}
      {!branch.is_head && !branch.is_remote && (
        <div className="hidden group-hover:flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              onCheckout();
            }}
            title="Checkout branch"
            aria-label="Checkout branch"
          >
            <ArrowRight className="h-3 w-3" />
          </Button>
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

interface BranchSectionProps {
  title: string;
  branches: BranchInfo[];
  viewingBranch: string | null;
  defaultExpanded?: boolean;
  className?: string;
  action?: React.ReactNode;
  onSelect: (name: string) => void;
  onCheckout: (name: string) => void;
  onDelete: (name: string) => void;
  onMerge: (name: string) => void;
}

function BranchSection({
  title,
  branches,
  viewingBranch,
  defaultExpanded = true,
  className,
  action,
  onSelect,
  onCheckout,
  onDelete,
  onMerge,
}: BranchSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (branches.length === 0) return null;

  return (
    <div className={className}>
      <div className="flex items-center gap-1 px-2 py-1">
        <button
          type="button"
          className="flex flex-1 items-center gap-1 cursor-pointer rounded-sm text-left"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          <span className="flex-1 text-xs font-medium text-muted-foreground">
            {title}
          </span>
          <span className="text-xs text-muted-foreground">{branches.length}</span>
        </button>
        {action}
      </div>
      {isExpanded && (
        <div>
          {branches.map((branch) => (
            <BranchItem
              key={branch.name}
              branch={branch}
              isViewing={viewingBranch === branch.name}
              onSelect={() => onSelect(branch.name)}
              onCheckout={() => onCheckout(branch.name)}
              onDelete={() => onDelete(branch.name)}
              onMerge={() => onMerge(branch.name)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function BranchList() {
  const { branches, checkoutBranch, deleteBranch, mergeBranch, viewBranchCommits, viewingBranch } =
    useRepoStore();
  const { openCreateBranchDialog } = useUiStore();
  const [branchToDelete, setBranchToDelete] = useState<string | null>(null);
  const [branchToCheckout, setBranchToCheckout] = useState<string | null>(null);

  const localBranches = branches.filter((b) => !b.is_remote);
  const remoteBranches = branches.filter((b) => b.is_remote);

  const handleSelect = (name: string) => {
    const branch = branches.find((b) => b.name === name);
    if (branch?.is_head) {
      viewBranchCommits(null);
    } else {
      viewBranchCommits(name);
    }
  };

  const handleCheckout = (name: string) => {
    const branch = branches.find((b) => b.name === name);
    if (branch?.is_head) return;
    setBranchToCheckout(name);
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1">
        <BranchSection
          title="Local"
          branches={localBranches}
          viewingBranch={viewingBranch}
          className="py-2"
          action={
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={openCreateBranchDialog}
              title="Create branch"
              aria-label="Create branch"
            >
              <Plus className="h-3 w-3" />
            </Button>
          }
          onSelect={handleSelect}
          onCheckout={handleCheckout}
          onDelete={setBranchToDelete}
          onMerge={mergeBranch}
        />
        <BranchSection
          title="Remote"
          branches={remoteBranches}
          viewingBranch={viewingBranch}
          className="py-2 border-t"
          onSelect={handleSelect}
          onCheckout={handleCheckout}
          onDelete={() => {}}
          onMerge={() => {}}
        />
      </ScrollArea>

      <ConfirmDialog
        open={branchToCheckout !== null}
        onOpenChange={(open) => { if (!open) setBranchToCheckout(null); }}
        title="Switch branch"
        description={
          <>
            Are you sure you want to switch to <span className="font-semibold text-foreground">{branchToCheckout}</span>? Any uncommitted changes may be affected.
          </>
        }
        confirmLabel="Switch"
        onConfirm={() => {
          if (branchToCheckout) {
            checkoutBranch(branchToCheckout);
          }
          setBranchToCheckout(null);
        }}
        onCancel={() => setBranchToCheckout(null)}
      />

      <ConfirmDialog
        open={branchToDelete !== null}
        onOpenChange={(open) => { if (!open) setBranchToDelete(null); }}
        title="Delete branch"
        description={
          <>
            Are you sure you want to delete <span className="font-semibold text-foreground">{branchToDelete}</span>? This action cannot be undone.
          </>
        }
        confirmLabel="Delete"
        confirmVariant="destructive"
        onConfirm={() => {
          if (branchToDelete) {
            deleteBranch(branchToDelete);
          }
          setBranchToDelete(null);
        }}
        onCancel={() => setBranchToDelete(null)}
      />
    </div>
  );
}
