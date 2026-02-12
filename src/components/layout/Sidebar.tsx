import { FileText, GitBranch } from 'lucide-react';
import { BranchList } from '@/components/branch/BranchList';
import { ScrollArea } from '@/components/common/ScrollArea/ScrollArea';
import { SidebarCommitBox } from '@/components/layout/SidebarCommitBox';
import { SidebarFileSection } from '@/components/layout/SidebarFileSection';
import { cn } from '@/lib/utils';
import { useRepoStore } from '@/stores/repoStore';
import type { SidebarTab } from '@/stores/uiStore';
import { useUiStore } from '@/stores/uiStore';

const tabs: { id: SidebarTab; label: string; icon: typeof FileText }[] = [
  { id: 'changes', label: 'Changes', icon: FileText },
  { id: 'branches', label: 'Branches', icon: GitBranch },
];

export function Sidebar() {
  const { status, stageAll, unstageAll, discardAll } = useRepoStore();
  const { sidebarTab, setSidebarTab } = useUiStore();

  const stagedFiles = status?.staged || [];
  const unstagedFiles = [
    ...(status?.unstaged || []),
    ...(status?.untracked || []),
  ];
  const conflictedFiles = status?.conflicted || [];

  const totalChanges =
    stagedFiles.length + unstagedFiles.length + conflictedFiles.length;

  return (
    <div className="flex h-full flex-col border-r border-border/40 bg-sidebar">
      <div className="m-2 flex rounded-lg border border-border/40 bg-card/70 p-1 shadow-xs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium transition-all duration-150',
              sidebarTab === tab.id
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:bg-accent/40 hover:text-foreground',
            )}
            onClick={() => setSidebarTab(tab.id)}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
            {tab.id === 'changes' && totalChanges > 0 && (
              <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] text-secondary-foreground">
                {totalChanges}
              </span>
            )}
          </button>
        ))}
      </div>

      {sidebarTab === 'changes' ? (
        <>
          <ScrollArea className="flex-1">
            <div className="p-2">
              {conflictedFiles.length > 0 && (
                <SidebarFileSection
                  title="Conflicts"
                  files={conflictedFiles}
                  isStaged={false}
                />
              )}
              <SidebarFileSection
                title="Staged Changes"
                files={stagedFiles}
                isStaged={true}
                onUnstageAll={unstageAll}
              />
              <SidebarFileSection
                title="Changes"
                files={unstagedFiles}
                isStaged={false}
                onStageAll={stageAll}
                onDiscardAll={discardAll}
              />
            </div>
          </ScrollArea>
          <SidebarCommitBox />
        </>
      ) : (
        <BranchList />
      )}
    </div>
  );
}
