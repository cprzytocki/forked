import { DiffLineComponent } from '@/components/diff/DiffLineComponent';
import type { DiffHunk } from '@/lib/types';

interface HunkViewProps {
  hunk: DiffHunk;
}

export function HunkView({ hunk }: HunkViewProps) {
  return (
    <div className="border-b border-border/40 last:border-b-0">
      <div className="sticky top-0 bg-muted/40 px-3 py-1.5 font-mono text-xs text-muted-foreground">
        {hunk.header.trim()}
      </div>
      <div>
        {hunk.lines.map((line) => (
          <DiffLineComponent
            key={`${line.origin}-${line.old_lineno ?? 'x'}-${line.new_lineno ?? 'x'}`}
            line={line}
          />
        ))}
      </div>
    </div>
  );
}
