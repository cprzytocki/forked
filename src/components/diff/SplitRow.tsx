import { SplitLineCell } from '@/components/diff/SplitLineCell';
import type { SplitDiffRow } from '@/lib/splitDiff';

interface SplitRowProps {
  row: SplitDiffRow;
}

export function SplitRow({ row }: SplitRowProps) {
  return (
    <div className="flex">
      <div className="w-1/2 border-r border-border/50">
        <SplitLineCell
          line={row.left}
          side="left"
          segments={row.leftSegments}
        />
      </div>
      <div className="w-1/2">
        <SplitLineCell
          line={row.right}
          side="right"
          segments={row.rightSegments}
        />
      </div>
    </div>
  );
}
