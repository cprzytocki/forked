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
        'flex w-full cursor-pointer items-center rounded-md px-2 py-1.5 text-sm transition-colors duration-100',
        'hover:bg-accent/70 hover:text-accent-foreground',
        destructive && 'text-destructive hover:text-destructive',
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
