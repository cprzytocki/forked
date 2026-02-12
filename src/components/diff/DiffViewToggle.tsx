import { Columns2, Rows3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/stores/settingsStore';

export function DiffViewToggle() {
  const diffViewMode = useSettingsStore((s) => s.diffViewMode);
  const setDiffViewMode = useSettingsStore((s) => s.setDiffViewMode);

  return (
    <div className="flex items-center gap-0.5 rounded-md bg-secondary/50 p-0.5">
      <button
        type="button"
        className={cn(
          'rounded px-1.5 py-1 transition-all duration-100',
          diffViewMode === 'unified'
            ? 'bg-background text-foreground shadow-xs'
            : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
        )}
        onClick={() => setDiffViewMode('unified')}
        title="Unified diff"
      >
        <Rows3 className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={cn(
          'rounded px-1.5 py-1 transition-all duration-100',
          diffViewMode === 'split'
            ? 'bg-background text-foreground shadow-xs'
            : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
        )}
        onClick={() => setDiffViewMode('split')}
        title="Side-by-side diff"
      >
        <Columns2 className="h-4 w-4" />
      </button>
    </div>
  );
}
