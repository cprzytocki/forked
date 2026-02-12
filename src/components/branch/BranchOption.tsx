import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BranchOptionProps {
  name: string;
  selected: boolean;
  onSelect: () => void;
}

export function BranchOption({
  name: branchName,
  selected,
  onSelect,
}: BranchOptionProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors duration-100',
        'hover:bg-accent/60 hover:text-accent-foreground',
        selected && 'bg-accent/70 shadow-xs',
      )}
    >
      <Check
        className={cn(
          'h-4 w-4 shrink-0',
          selected ? 'opacity-100' : 'opacity-0',
        )}
      />
      <span className="truncate">{branchName}</span>
    </button>
  );
}
