import { Columns2, Rows3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/stores/settingsStore';

export function DiffViewToggle() {
  const diffViewMode = useSettingsStore((s) => s.diffViewMode);
  const setDiffViewMode = useSettingsStore((s) => s.setDiffViewMode);

  return (
    <div className="flex items-center gap-0.5">
      <button
        type="button"
        className={cn(
          'p-1 rounded',
          diffViewMode === 'unified'
            ? 'bg-accent text-accent-foreground'
            : 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
        )}
        onClick={() => setDiffViewMode('unified')}
        title="Unified diff"
      >
        <Rows3 className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={cn(
          'p-1 rounded',
          diffViewMode === 'split'
            ? 'bg-accent text-accent-foreground'
            : 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
        )}
        onClick={() => setDiffViewMode('split')}
        title="Side-by-side diff"
      >
        <Columns2 className="h-4 w-4" />
      </button>
    </div>
  );
}
