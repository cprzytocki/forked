import { Clock, Hash, Tag, User } from 'lucide-react';
import { useState } from 'react';
import { DiffViewToggle } from '@/components/diff/DiffViewToggle';
import { CommitDetailsFileItem } from '@/components/history/CommitDetailsFileItem';
import type { CommitDiff, CommitInfo } from '@/lib/types';
import { formatDate } from '@/lib/utils';

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
      <div className="border-b border-border/40 bg-card p-4">
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
          {commit.tag_names.length > 0 && (
            <div className="flex items-center gap-2">
              <Tag className="h-3 w-3" />
              <div className="flex items-center gap-1.5 flex-wrap">
                {commit.tag_names.map((name) => (
                  <span key={name} className="tag-badge">
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}
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

      <div className="flex items-center justify-between border-b border-border/40 p-2 text-xs">
        <div className="flex items-center gap-4">
          <span>{diff.stats.files_changed} files changed</span>
          <span className="text-git-added">+{diff.stats.insertions}</span>
          <span className="text-git-removed">-{diff.stats.deletions}</span>
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

      <div>
        {diff.files.map((file) => (
          <CommitDetailsFileItem
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
