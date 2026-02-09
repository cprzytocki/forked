import type React from 'react';
import { useCallback, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

export interface ContextMenuPosition {
  x: number;
  y: number;
}

interface ContextMenuProps {
  position: ContextMenuPosition | null;
  onClose: () => void;
  children: React.ReactNode;
}

export function ContextMenu({ position, onClose, children }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    if (!position) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };

    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [position, handleClose]);

  if (!position) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[180px] rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
      style={{ left: position.x, top: position.y }}
    >
      {children}
    </div>
  );
}

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
