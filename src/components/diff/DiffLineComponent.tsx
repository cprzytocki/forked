import type { DiffLine } from '@/lib/types';
import { cn } from '@/lib/utils';

interface DiffLineProps {
  line: DiffLine;
}

export function DiffLineComponent({ line }: DiffLineProps) {
  const getLineClass = () => {
    switch (line.origin) {
      case '+':
        return 'bg-git-added/10 text-git-added';
      case '-':
        return 'bg-git-removed/10 text-git-removed';
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
      <span className="w-12 border-r border-border/30 pr-2 text-right text-muted-foreground select-none">
        {line.old_lineno || ''}
      </span>
      <span className="w-12 border-r border-border/30 pr-2 text-right text-muted-foreground select-none">
        {line.new_lineno || ''}
      </span>
      <span className="w-4 text-center select-none">{getLinePrefix()}</span>
      <pre className="flex-1 pl-1 whitespace-pre-wrap break-all">
        {line.content}
      </pre>
    </div>
  );
}
