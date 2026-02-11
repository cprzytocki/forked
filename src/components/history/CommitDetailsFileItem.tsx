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
    <div className="border-b last:border-b-0">
      <button
        type="button"
        className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-accent w-full text-left"
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
            <span className="text-green-500 flex items-center">
              <Plus className="h-3 w-3" />
              {additions}
            </span>
          )}
          {deletions > 0 && (
            <span className="text-red-500 flex items-center">
              <Minus className="h-3 w-3" />
              {deletions}
            </span>
          )}
        </span>
      </button>
      {isExpanded && (
        <div className="border-t">
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
