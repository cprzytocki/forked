import type { DiffLine } from '@/lib/types';
import { cn } from '@/lib/utils';

interface DiffLineProps {
  line: DiffLine;
}

export function DiffLineComponent({ line }: DiffLineProps) {
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
