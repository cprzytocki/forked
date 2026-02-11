import { DiffLineComponent } from '@/components/diff/DiffLineComponent';
import type { DiffHunk } from '@/lib/types';

interface HunkViewProps {
  hunk: DiffHunk;
}

export function HunkView({ hunk }: HunkViewProps) {
  return (
    <div className="border-b last:border-b-0">
      <div className="bg-muted px-2 py-1 text-xs font-mono text-muted-foreground sticky top-0">
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
