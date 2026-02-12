import { Plus } from 'lucide-react';
import { useState } from 'react';
import { BranchSection } from '@/components/branch/BranchSection';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ScrollArea } from '@/components/common/ScrollArea/ScrollArea';
import { useRepoStore } from '@/stores/repoStore';
import { useUiStore } from '@/stores/uiStore';

export function BranchList() {
  const { branches, checkoutBranch, deleteBranch } = useRepoStore();
  const { openCreateBranchDialog } = useUiStore();
  const [branchToDelete, setBranchToDelete] = useState<string | null>(null);
  const [branchToCheckout, setBranchToCheckout] = useState<string | null>(null);

  const localBranches = branches.filter((b) => !b.is_remote);
  const remoteBranches = branches.filter((b) => b.is_remote);

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
          className="py-1"
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
          onCheckout={handleCheckout}
          onDelete={setBranchToDelete}
        />
        <BranchSection
          title="Remote"
          branches={remoteBranches}
          className="py-2 border-t"
          onCheckout={handleCheckout}
          onDelete={() => {}}
        />
      </ScrollArea>

      <ConfirmDialog
        open={branchToCheckout !== null}
        onOpenChange={(open) => {
          if (!open) setBranchToCheckout(null);
        }}
        title="Switch branch"
        description={
          <>
            Are you sure you want to switch to{' '}
            <span className="font-semibold text-foreground">
              {branchToCheckout}
            </span>
            ? Any uncommitted changes may be affected.
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
        onOpenChange={(open) => {
          if (!open) setBranchToDelete(null);
        }}
        title="Delete branch"
        description={
          <>
            Are you sure you want to delete{' '}
            <span className="font-semibold text-foreground">
              {branchToDelete}
            </span>
            ? This action cannot be undone.
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
