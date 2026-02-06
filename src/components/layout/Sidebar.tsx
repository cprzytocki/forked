import React, { useState } from "react";
import { useRepoStore } from "@/stores/repoStore";
import { useUiStore } from "@/stores/uiStore";
import { Button } from "@/components/common/Button";
import { ScrollArea } from "@/components/common/ScrollArea";
import { cn, getStatusColor, getStatusIcon, getFileName } from "@/lib/utils";
import type { FileStatus } from "@/lib/types";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Minus,
  RotateCcw,
  Check,
} from "lucide-react";

interface FileItemProps {
  file: FileStatus;
  isSelected: boolean;
  isStaged: boolean;
  onSelect: () => void;
  onStage?: () => void;
  onUnstage?: () => void;
  onDiscard?: () => void;
}

function FileItem({
  file,
  isSelected,
  isStaged,
  onSelect,
  onStage,
  onUnstage,
  onDiscard,
}: FileItemProps) {
  return (
    <div
      className={cn(
        "group flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-accent rounded-sm",
        isSelected && "bg-accent"
      )}
      onClick={onSelect}
    >
      <span className={cn("w-4 text-center font-mono text-xs", getStatusColor(file.status))}>
        {getStatusIcon(file.status)}
      </span>
      <span className="flex-1 truncate text-sm">{getFileName(file.path)}</span>
      <span className="text-xs text-muted-foreground truncate max-w-[100px]" title={file.path}>
        {file.path.includes("/") ? file.path.split("/").slice(0, -1).join("/") : ""}
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
          >
            <Minus className="h-3 w-3" />
          </Button>
        ) : (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={(e) => {
                e.stopPropagation();
                onStage?.();
              }}
              title="Stage"
            >
              <Plus className="h-3 w-3" />
            </Button>
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
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

interface FileSectionProps {
  title: string;
  files: FileStatus[];
  isStaged: boolean;
  onStageAll?: () => void;
  onUnstageAll?: () => void;
}

function FileSection({ title, files, isStaged, onStageAll, onUnstageAll }: FileSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { selectedFilePath, isSelectedFileStaged, selectFile } = useUiStore();
  const { stageFile, unstageFile, discardChanges } = useRepoStore();

  if (files.length === 0) return null;

  return (
    <div className="mb-2">
      <div
        className="flex items-center gap-1 px-2 py-1 cursor-pointer hover:bg-accent rounded-sm"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
        <span className="flex-1 text-sm font-medium">{title}</span>
        <span className="text-xs text-muted-foreground">{files.length}</span>
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
          >
            <Plus className="h-3 w-3" />
          </Button>
        )}
      </div>
      {isExpanded && (
        <div className="ml-2">
          {files.map((file) => (
            <FileItem
              key={file.path}
              file={file}
              isSelected={selectedFilePath === file.path && isSelectedFileStaged === isStaged}
              isStaged={isStaged}
              onSelect={() => selectFile(file, isStaged)}
              onStage={() => stageFile(file.path)}
              onUnstage={() => unstageFile(file.path)}
              onDiscard={() => discardChanges(file.path)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface CommitBoxProps {
  onCommit: (message: string) => void;
  disabled: boolean;
}

function CommitBox({ onCommit, disabled }: CommitBoxProps) {
  const [message, setMessage] = useState("");

  const handleCommit = () => {
    if (message.trim()) {
      onCommit(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleCommit();
    }
  };

  return (
    <div className="p-2 border-t">
      <textarea
        className="w-full h-20 p-2 text-sm bg-background border rounded-md resize-none focus:outline-none focus:ring-1 focus:ring-ring"
        placeholder="Commit message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <Button
        className="w-full mt-2"
        disabled={disabled || !message.trim()}
        onClick={handleCommit}
      >
        <Check className="h-4 w-4 mr-2" />
        Commit
      </Button>
    </div>
  );
}

export function Sidebar() {
  const { status, stageAll, unstageAll, createCommit } = useRepoStore();

  const stagedFiles = status?.staged || [];
  const unstagedFiles = [...(status?.unstaged || []), ...(status?.untracked || [])];
  const conflictedFiles = status?.conflicted || [];

  const hasStaged = stagedFiles.length > 0;

  return (
    <div className="flex flex-col h-full border-r">
      <div className="p-2 border-b">
        <h2 className="font-semibold text-sm">Changes</h2>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2">
          {conflictedFiles.length > 0 && (
            <FileSection
              title="Conflicts"
              files={conflictedFiles}
              isStaged={false}
            />
          )}
          <FileSection
            title="Staged Changes"
            files={stagedFiles}
            isStaged={true}
            onUnstageAll={unstageAll}
          />
          <FileSection
            title="Changes"
            files={unstagedFiles}
            isStaged={false}
            onStageAll={stageAll}
          />
        </div>
      </ScrollArea>
      <CommitBox onCommit={createCommit} disabled={!hasStaged} />
    </div>
  );
}
