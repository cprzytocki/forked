import { ChevronDown, ChevronRight, Minus, Plus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { SidebarFileItem } from '@/components/layout/SidebarFileItem';
import type { FileStatus } from '@/lib/types';
import { getFileName } from '@/lib/utils';
import { useRepoStore } from '@/stores/repoStore';
import { useUiStore } from '@/stores/uiStore';

interface SidebarFileSectionProps {
  title: string;
  files: FileStatus[];
  isStaged: boolean;
  onStageAll?: () => void;
  onUnstageAll?: () => void;
}

export function SidebarFileSection({
  title,
  files,
  isStaged,
  onStageAll,
  onUnstageAll,
}: SidebarFileSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [fileToDiscard, setFileToDiscard] = useState<string | null>(null);
  const { selectedFilePath, isSelectedFileStaged, selectFile } = useUiStore();
  const { stageFile, unstageFile, discardChanges } = useRepoStore();

  if (files.length === 0) return null;

  return (
    <div className="mb-2">
      <button
        type="button"
        className="flex items-center gap-1 px-2 py-1 cursor-pointer hover:bg-accent rounded-sm w-full text-left"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
        <span className="flex-1 text-sm font-medium">{title}</span>
        {isStaged ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={(e) => {
              e.stopPropagation();
              onUnstageAll?.();
            }}
            title="Unstage all"
            aria-label="Unstage all"
          >
            <Minus className="h-3 w-3" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={(e) => {
              e.stopPropagation();
              onStageAll?.();
            }}
            title="Stage all"
            aria-label="Stage all"
          >
            <Plus className="h-3 w-3" />
          </Button>
        )}
      </button>
      {isExpanded && (
        <div className="ml-2">
          {files.map((file) => (
            <SidebarFileItem
              key={file.path}
              file={file}
              isSelected={
                selectedFilePath === file.path &&
                isSelectedFileStaged === isStaged
              }
              isStaged={isStaged}
              onSelect={() => selectFile(file, isStaged)}
              onStage={() => stageFile(file.path)}
              onUnstage={() => unstageFile(file.path)}
              onDiscard={() => setFileToDiscard(file.path)}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={fileToDiscard !== null}
        onOpenChange={(open) => {
          if (!open) setFileToDiscard(null);
        }}
        title="Discard changes"
        description={
          <>
            Are you sure you want to discard changes to{' '}
            <span className="font-semibold text-foreground">
              {fileToDiscard && getFileName(fileToDiscard)}
            </span>
            ? This action cannot be undone.
          </>
        }
        confirmLabel="Discard"
        confirmVariant="destructive"
        onConfirm={() => {
          if (fileToDiscard) {
            discardChanges(fileToDiscard);
          }
          setFileToDiscard(null);
        }}
        onCancel={() => setFileToDiscard(null)}
      />
    </div>
  );
}
