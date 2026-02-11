import { useMemo } from 'react';
import { SplitHunkView } from '@/components/diff/SplitHunkView';
import { splitDiffHunks } from '@/lib/splitDiff';
import type { FileDiff } from '@/lib/types';

interface SplitDiffViewerProps {
  diff: FileDiff;
}

export function SplitDiffViewer({ diff }: SplitDiffViewerProps) {
  const splitHunks = useMemo(() => splitDiffHunks(diff.hunks), [diff.hunks]);

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
      {splitHunks.map((hunk) => (
        <SplitHunkView key={hunk.header} hunk={hunk} />
      ))}
    </div>
  );
}
