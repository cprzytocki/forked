import { Tag } from 'lucide-react';
import type React from 'react';
import { CommitGraph } from '@/components/history/CommitGraph';
import type { CommitGraphEntry } from '@/lib/types';
import { cn, formatRelativeTime, getBranchColorHsl } from '@/lib/utils';

interface CommitItemProps {
  entry: CommitGraphEntry;
  isSelected: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  maxLanes: number;
}

export function CommitItem({
  entry,
  isSelected,
  onSelect,
  onContextMenu,
  maxLanes,
}: CommitItemProps) {
  const { commit, graph } = entry;

  return (
    <button
      type="button"
      className={cn(
        'pl-1 flex items-center cursor-pointer transition-colors w-full text-left',
        'hover:bg-surface-hover',
        isSelected && 'bg-accent/70',
      )}
      onClick={onSelect}
      onContextMenu={onContextMenu}
    >
      <div className="flex-shrink-0">
        <CommitGraph node={graph} maxLanes={maxLanes} />
      </div>

      <div className="flex-1 min-w-0 px-2 py-1.5 flex items-center gap-2">
        {graph.branch_names.map((name) => (
          <span
            key={name}
            className="branch-badge"
            style={{
              backgroundColor: `${getBranchColorHsl(graph.color_index)}`,
              color: 'white',
            }}
          >
            {name}
          </span>
        ))}
        {commit.tag_names.map((name) => (
          <span key={name} className="tag-badge" title={name}>
            <Tag className="h-3 w-3" />
            {name}
          </span>
        ))}
        <span className="truncate text-[13px] font-normal">
          {commit.summary}
        </span>
      </div>

      <div className="w-[120px] flex-shrink-0 truncate px-2 text-xs text-muted-foreground/90">
        {commit.author_name}
      </div>

      <div className="w-[70px] flex-shrink-0 px-2 font-mono text-[11px] text-muted-foreground/80">
        {commit.short_id}
      </div>

      <div className="w-[100px] flex-shrink-0 px-2 pr-3 text-right text-xs text-muted-foreground/80">
        {formatRelativeTime(commit.time)}
      </div>
    </button>
  );
}
