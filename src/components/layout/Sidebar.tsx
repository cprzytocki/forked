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
  const { status, stageAll, unstageAll, discardAll, createCommit } =
    useRepoStore();
  const { sidebarTab, setSidebarTab } = useUiStore();

  const stagedFiles = status?.staged || [];
  const unstagedFiles = [
    ...(status?.unstaged || []),
    ...(status?.untracked || []),
  ];
  const conflictedFiles = status?.conflicted || [];

  const hasStaged = stagedFiles.length > 0;
  const totalChanges =
    stagedFiles.length + unstagedFiles.length + conflictedFiles.length;

  return (
    <div className="flex flex-col h-full border-r">
      <div className="flex border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-sm font-medium transition-colors',
              sidebarTab === tab.id
                ? 'text-foreground border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground',
            )}
            onClick={() => setSidebarTab(tab.id)}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
            {tab.id === 'changes' && totalChanges > 0 && (
              <span className="text-xs text-muted-foreground">
                ({totalChanges})
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
          <SidebarCommitBox onCommit={createCommit} disabled={!hasStaged} />
        </>
      ) : (
        <BranchList />
      )}
    </div>
  );
}
