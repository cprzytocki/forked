import { Minus, Plus, RotateCcw } from 'lucide-react';
import { Button } from '@/components/common/Button';
import type { FileStatus } from '@/lib/types';
import { cn, getFileName, getStatusColor, getStatusIcon } from '@/lib/utils';
import { useRepoStore } from '@/stores/repoStore';
import { useUiStore } from '@/stores/uiStore';

interface SidebarFileItemProps {
  file: FileStatus;
  isStaged: boolean;
  onDiscard?: () => void;
}

export function SidebarFileItem({
  file,
  isStaged,
  onDiscard,
}: SidebarFileItemProps) {
  const { selectedFilePath, isSelectedFileStaged, selectFile } = useUiStore();
  const { stageFile, unstageFile } = useRepoStore();
  const isSelected =
    selectedFilePath === file.path && isSelectedFileStaged === isStaged;

  return (
    <button
      type="button"
      className={cn(
        'group flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-accent rounded-sm w-full text-left',
        isSelected && 'bg-accent',
      )}
      onClick={() => selectFile(file, isStaged)}
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
              unstageFile(file.path);
            }}
            title="Unstage"
            aria-label="Unstage"
          >
            <Minus className="h-3 w-3" />
          </Button>
        ) : (
          <>
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
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={(e) => {
                e.stopPropagation();
                stageFile(file.path);
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
