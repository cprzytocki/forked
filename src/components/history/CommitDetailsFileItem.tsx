import { ChevronDown, ChevronRight, Minus, Plus } from 'lucide-react';
import { DiffViewer } from '@/components/diff/DiffViewer';
import { SplitDiffViewer } from '@/components/diff/SplitDiffViewer';
import type { FileDiff } from '@/lib/types';
import { cn, getStatusColor } from '@/lib/utils';
import { useSettingsStore } from '@/stores/settingsStore';

interface FileItemProps {
  file: FileDiff;
  isExpanded: boolean;
  onToggle: () => void;
}

export function CommitDetailsFileItem({
  file,
  isExpanded,
  onToggle,
}: FileItemProps) {
  const diffViewMode = useSettingsStore((s) => s.diffViewMode);
  const additions = file.hunks.reduce(
    (sum, hunk) => sum + hunk.lines.filter((l) => l.origin === '+').length,
    0,
  );
  const deletions = file.hunks.reduce(
    (sum, hunk) => sum + hunk.lines.filter((l) => l.origin === '-').length,
    0,
  );

  return (
    <div className="border-b border-border/40 last:border-b-0">
      <button
        type="button"
        className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left transition-colors duration-100 hover:bg-accent/40"
        onClick={onToggle}
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
        <span className={cn('text-sm', getStatusColor(file.status))}>
          {file.path}
        </span>
        <span className="ml-auto flex items-center gap-2 text-xs">
          {additions > 0 && (
            <span className="flex items-center text-git-added">
              <Plus className="h-3 w-3" />
              {additions}
            </span>
          )}
          {deletions > 0 && (
            <span className="flex items-center text-git-removed">
              <Minus className="h-3 w-3" />
              {deletions}
            </span>
          )}
        </span>
      </button>
      {isExpanded && (
        <div className="border-t border-border/30">
          {diffViewMode === 'split' ? (
            <SplitDiffViewer diff={file} />
          ) : (
            <DiffViewer diff={file} />
          )}
        </div>
      )}
    </div>
  );
}
