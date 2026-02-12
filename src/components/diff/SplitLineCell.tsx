import type { InlineSegment } from '@/lib/splitDiff';
import type { DiffLine } from '@/lib/types';
import { cn } from '@/lib/utils';

interface SplitLineCellProps {
  line: DiffLine | null;
  side: 'left' | 'right';
  segments?: InlineSegment[];
}

export function SplitLineCell({ line, side, segments }: SplitLineCellProps) {
  if (!line) {
    return <div className="flex bg-muted/15 font-mono text-xs" />;
  }

  const isAdd = line.origin === '+';
  const isDel = line.origin === '-';

  const bgClass = isDel ? 'bg-git-removed/15' : isAdd ? 'bg-git-added/15' : '';

  const highlightClass = isDel
    ? 'bg-git-removed/30'
    : isAdd
      ? 'bg-git-added/30'
      : '';

  const lineNo = side === 'left' ? line.old_lineno : line.new_lineno;

  return (
    <div className={cn('flex font-mono text-xs', bgClass)}>
      <span className="w-12 text-right pr-2 text-muted-foreground/60 select-none shrink-0">
        {lineNo || ''}
      </span>
      <pre className="flex-1 pl-2 whitespace-pre-wrap break-all">
        {segments
          ? segments.map((seg) =>
              seg.highlighted ? (
                <span key={seg.text} className={highlightClass}>
                  {seg.text}
                </span>
              ) : (
                seg.text
              ),
            )
          : line.content}
      </pre>
    </div>
  );
}
