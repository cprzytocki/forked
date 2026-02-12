import {
  ChevronDown,
  ChevronRight,
  Minus,
  Plus,
  RotateCcw,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { SidebarFileItem } from '@/components/layout/SidebarFileItem';
import type { FileStatus } from '@/lib/types';
import { getFileName } from '@/lib/utils';
import { useRepoStore } from '@/stores/repoStore';

interface SidebarFileSectionProps {
  title: string;
  files: FileStatus[];
  isStaged: boolean;
  onStageAll?: () => void;
  onUnstageAll?: () => void;
  onDiscardAll?: () => void;
}

export function SidebarFileSection({
  title,
  files,
  isStaged,
  onStageAll,
  onUnstageAll,
  onDiscardAll,
}: SidebarFileSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [fileToDiscard, setFileToDiscard] = useState<string | null>(null);
  const [discardAllConfirmOpen, setDiscardAllConfirmOpen] = useState(false);
  const { discardChanges } = useRepoStore();

  if (files.length === 0) return null;

  return (
    <div className="mb-2">
      <button
        type="button"
        className="flex w-full cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-left transition-colors duration-100 hover:bg-accent/40"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
        <span className="flex-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
          {title}
        </span>
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
          (onStageAll || onDiscardAll) && (
            <div className="flex items-center gap-1">
              {onDiscardAll && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDiscardAllConfirmOpen(true);
                  }}
                  title="Discard all"
                  aria-label="Discard all"
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
              )}
              {onStageAll && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStageAll();
                  }}
                  title="Stage all"
                  aria-label="Stage all"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              )}
            </div>
          )
        )}
      </button>
      {isExpanded && (
        <div className="ml-2">
          {files.map((file) => (
            <SidebarFileItem
              key={file.path}
              file={file}
              isStaged={isStaged}
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
      <ConfirmDialog
        open={discardAllConfirmOpen}
        onOpenChange={(open) => setDiscardAllConfirmOpen(open)}
        title="Discard all changes"
        description="Are you sure you want to discard all unstaged changes? This action cannot be undone."
        confirmLabel="Discard All"
        confirmVariant="destructive"
        onConfirm={() => {
          onDiscardAll?.();
          setDiscardAllConfirmOpen(false);
        }}
        onCancel={() => setDiscardAllConfirmOpen(false)}
      />
    </div>
  );
}
