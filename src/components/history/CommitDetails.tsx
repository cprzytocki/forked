import {
  ChevronDown,
  ChevronRight,
  Clock,
  Hash,
  Minus,
  Plus,
  User,
} from 'lucide-react';
import { useState } from 'react';
import { DiffViewer } from '@/components/diff/DiffViewer';
import { DiffViewToggle } from '@/components/diff/DiffViewToggle';
import { SplitDiffViewer } from '@/components/diff/SplitDiffViewer';
import type { CommitDiff, CommitInfo, FileDiff } from '@/lib/types';
import { cn, formatDate, getStatusColor } from '@/lib/utils';
import { useSettingsStore } from '@/stores/settingsStore';

interface FileItemProps {
  file: FileDiff;
  isExpanded: boolean;
  onToggle: () => void;
}

function FileItem({ file, isExpanded, onToggle }: FileItemProps) {
  const diffViewMode = useSettingsStore((s) => s.diffViewMode);
  const additions = file.hunks.reduce(
    (sum, hunk) => sum + hunk.lines.filter((l) => l.origin === '+').length,
    0,
  );
  const deletions = file.hunks.reduce(
    (sum, hunk) => sum + hunk.lines.filter((l) => l.origin === '-').length,
    0,
  );

  return (
    <div className="border-b last:border-b-0">
      <button
        type="button"
        className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-accent w-full text-left"
        onClick={onToggle}
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
        <span className={cn('text-sm', getStatusColor(file.status))}>
          {file.path}
        </span>
        <span className="ml-auto flex items-center gap-2 text-xs">
          {additions > 0 && (
            <span className="text-green-500 flex items-center">
              <Plus className="h-3 w-3" />
              {additions}
            </span>
          )}
          {deletions > 0 && (
            <span className="text-red-500 flex items-center">
              <Minus className="h-3 w-3" />
              {deletions}
            </span>
          )}
        </span>
      </button>
      {isExpanded && (
        <div className="border-t">
          {diffViewMode === 'split' ? (
            <SplitDiffViewer diff={file} />
          ) : (
            <DiffViewer diff={file} />
          )}
        </div>
      )}
    </div>
  );
}

interface CommitDetailsProps {
  commit: CommitInfo;
  diff: CommitDiff;
}

export function CommitDetails({ commit, diff }: CommitDetailsProps) {
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());

  const toggleFile = (path: string) => {
    setExpandedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedFiles(new Set(diff.files.map((f) => f.path)));
  };

  const collapseAll = () => {
    setExpandedFiles(new Set());
  };

  return (
    <div>
      {/* Commit info */}
      <div className="p-4 border-b bg-muted/50">
        <p className="text-sm mb-4">{commit.message}</p>
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <User className="h-3 w-3" />
            <span>{commit.author_name}</span>
            <span className="text-muted-foreground/50">
              &lt;{commit.author_email}&gt;
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3" />
            <span>{formatDate(commit.time)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Hash className="h-3 w-3" />
            <span className="font-mono">{commit.id}</span>
          </div>
          {commit.parent_ids.length > 0 && (
            <div className="flex items-center gap-2">
              <span>Parents:</span>
              {commit.parent_ids.map((id) => (
                <span key={id} className="font-mono">
                  {id.substring(0, 7)}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="p-2 border-b flex items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          <span>{diff.stats.files_changed} files changed</span>
          <span className="text-green-500">+{diff.stats.insertions}</span>
          <span className="text-red-500">-{diff.stats.deletions}</span>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="hover:underline" onClick={expandAll}>
            Expand all
          </button>
          <span>/</span>
          <button
            type="button"
            className="hover:underline"
            onClick={collapseAll}
          >
            Collapse all
          </button>
          <DiffViewToggle />
        </div>
      </div>

      {/* File list */}
      <div>
        {diff.files.map((file) => (
          <FileItem
            key={file.path}
            file={file}
            isExpanded={expandedFiles.has(file.path)}
            onToggle={() => toggleFile(file.path)}
          />
        ))}
      </div>
    </div>
  );
}
