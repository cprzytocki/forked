import { ChevronDown, ChevronRight } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { BranchItem } from '@/components/branch/BranchItem';
import type { BranchInfo } from '@/lib/types';

interface BranchSectionProps {
  title: string;
  branches: BranchInfo[];
  defaultExpanded?: boolean;
  className?: string;
  action?: React.ReactNode;
  onCheckout: (name: string) => void;
  onDelete: (name: string) => void;
}

export function BranchSection({
  title,
  branches,
  defaultExpanded = true,
  className,
  action,
  onCheckout,
  onDelete,
}: BranchSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (branches.length === 0) return null;

  return (
    <div className={className}>
      <div className="flex items-center gap-1 px-2 py-1">
        <button
          type="button"
          className="flex flex-1 items-center gap-1 cursor-pointer rounded-sm text-left"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          <span className="flex-1 text-xs font-medium text-muted-foreground">
            {title}
          </span>
          <span className="text-xs text-muted-foreground">
            {branches.length}
          </span>
        </button>
        {action}
      </div>
      {isExpanded && (
        <div>
          {branches.map((branch) => (
            <BranchItem
              key={branch.name}
              branch={branch}
              onCheckout={() => onCheckout(branch.name)}
              onDelete={() => onDelete(branch.name)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
