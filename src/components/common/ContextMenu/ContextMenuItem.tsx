import type React from 'react';
import { cn } from '@/lib/utils';

interface ContextMenuItemProps {
  onClick: () => void;
  destructive?: boolean;
  children: React.ReactNode;
}

export function ContextMenuItem({
  onClick,
  destructive,
  children,
}: ContextMenuItemProps) {
  return (
    <button
      type="button"
      className={cn(
        'flex w-full items-center rounded-sm px-2 py-1.5 text-sm cursor-pointer',
        'hover:bg-accent hover:text-accent-foreground',
        destructive && 'text-destructive hover:text-destructive',
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
