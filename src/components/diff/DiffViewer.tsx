import type { DiffHunk, DiffLine, FileDiff } from '@/lib/types';
import { cn } from '@/lib/utils';

interface DiffLineProps {
  line: DiffLine;
}

function DiffLineComponent({ line }: DiffLineProps) {
  const getLineClass = () => {
    switch (line.origin) {
      case '+':
        return 'bg-green-500/10 text-green-600 dark:text-green-400';
      case '-':
        return 'bg-red-500/10 text-red-600 dark:text-red-400';
      default:
        return '';
    }
  };

  const getLinePrefix = () => {
    switch (line.origin) {
      case '+':
        return '+';
      case '-':
        return '-';
      default:
        return ' ';
    }
  };

  return (
    <div className={cn('flex font-mono text-xs', getLineClass())}>
      <span className="w-12 text-right pr-2 text-muted-foreground select-none border-r">
        {line.old_lineno || ''}
      </span>
      <span className="w-12 text-right pr-2 text-muted-foreground select-none border-r">
        {line.new_lineno || ''}
      </span>
      <span className="w-4 text-center select-none">{getLinePrefix()}</span>
      <pre className="flex-1 pl-1 whitespace-pre-wrap break-all">
        {line.content}
      </pre>
    </div>
  );
}

interface HunkViewProps {
  hunk: DiffHunk;
}

function HunkView({ hunk }: HunkViewProps) {
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
