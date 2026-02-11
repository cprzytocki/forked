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
        'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer',
        'hover:bg-accent hover:text-accent-foreground',
        selected && 'bg-accent',
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
