import { Minus, Plus, RotateCcw } from 'lucide-react';
import { Button } from '@/components/common/Button';
import type { FileStatus } from '@/lib/types';
import { cn, getFileName, getStatusColor, getStatusIcon } from '@/lib/utils';

interface SidebarFileItemProps {
  file: FileStatus;
  isSelected: boolean;
  isStaged: boolean;
  onSelect: () => void;
  onStage?: () => void;
  onUnstage?: () => void;
  onDiscard?: () => void;
}

export function SidebarFileItem({
  file,
  isSelected,
  isStaged,
  onSelect,
  onStage,
  onUnstage,
  onDiscard,
}: SidebarFileItemProps) {
  return (
    <button
      type="button"
      className={cn(
        'group flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-accent rounded-sm w-full text-left',
        isSelected && 'bg-accent',
      )}
      onClick={onSelect}
    >
      <span
        className={cn(
          'w-4 text-center font-mono text-xs',
          getStatusColor(file.status),
        )}
      >
        {getStatusIcon(file.status)}
      </span>
      <span className="flex-1 truncate text-sm">{getFileName(file.path)}</span>
      <span
        className="text-xs text-muted-foreground truncate max-w-[100px]"
        title={file.path}
      >
        {file.path.includes('/')
          ? file.path.split('/').slice(0, -1).join('/')
          : ''}
      </span>
      <div className="hidden group-hover:flex items-center gap-1">
        {isStaged ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={(e) => {
              e.stopPropagation();
              onUnstage?.();
            }}
            title="Unstage"
            aria-label="Unstage"
          >
            <Minus className="h-3 w-3" />
          </Button>
        ) : (
          <>
            {!file.is_new && (
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDiscard?.();
                }}
                title="Discard changes"
                aria-label="Discard changes"
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={(e) => {
                e.stopPropagation();
                onStage?.();
              }}
              title="Stage"
              aria-label="Stage"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </>
        )}
      </div>
    </button>
  );
}
