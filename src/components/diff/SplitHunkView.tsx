import { SplitRow } from '@/components/diff/SplitRow';
import type { SplitHunk } from '@/lib/splitDiff';

interface SplitHunkViewProps {
  hunk: SplitHunk;
}

export function SplitHunkView({ hunk }: SplitHunkViewProps) {
  return (
    <div className="border-b last:border-b-0">
      <div className="bg-muted px-2 py-1 text-xs font-mono text-muted-foreground sticky top-0">
        {hunk.header.trim()}
      </div>
      <div>
        {hunk.rows.map((row) => (
          <SplitRow
            key={`${row.left?.origin ?? 'x'}-${row.left?.old_lineno ?? 'x'}-${row.right?.new_lineno ?? 'x'}`}
            row={row}
          />
        ))}
      </div>
    </div>
  );
}
