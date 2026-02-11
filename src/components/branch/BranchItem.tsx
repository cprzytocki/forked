import {
  ArrowRight,
  Check,
  Cloud,
  GitBranch,
  GitMerge,
  Star,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { BranchTrackingIndicators } from '@/components/branch/BranchTrackingIndicators';
import { Button } from '@/components/common/Button';
import type { BranchInfo } from '@/lib/types';
import { cn } from '@/lib/utils';

interface BranchItemProps {
  branch: BranchInfo;
  isViewing: boolean;
  onSelect: () => void;
  onCheckout: () => void;
  onDelete: () => void;
  onMerge: () => void;
}

export function BranchItem({
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
      ) : branch.upstream === null ? (
        <span
          className="text-muted-foreground"
          title="Branch is not tracking a remote branch yet"
          aria-label="Branch is not tracking a remote branch yet"
        >
          <UploadCloud className="h-4 w-4" />
        </span>
      ) : (
        <GitBranch className="h-4 w-4 text-muted-foreground" />
      )}
      <span className="flex-1 text-sm truncate">
        {branch.name}
        {branch.is_default && (
          <Star className="inline h-3 w-3 ml-1 text-yellow-500 fill-yellow-500 align-middle" />
        )}
      </span>
      <BranchTrackingIndicators ahead={branch.ahead} behind={branch.behind} />
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
