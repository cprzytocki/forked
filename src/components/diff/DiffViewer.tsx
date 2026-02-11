import { HunkView } from '@/components/diff/HunkView';
import type { FileDiff } from '@/lib/types';

interface DiffViewerProps {
  diff: FileDiff;
}

export function DiffViewer({ diff }: DiffViewerProps) {
  if (diff.is_binary) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground">
        <p>Binary file cannot be displayed</p>
      </div>
    );
  }

  if (diff.hunks.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground">
        <p>No changes to display</p>
      </div>
    );
  }

  return (
    <div className="min-w-0">
      {diff.hunks.map((hunk) => (
        <HunkView key={hunk.header} hunk={hunk} />
      ))}
    </div>
  );
}
