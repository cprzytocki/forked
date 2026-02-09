import { listen } from '@tauri-apps/api/event';
import { useCallback, useEffect, useRef } from 'react';
import { CreateBranchDialog } from '@/components/branch/CreateBranchDialog';
import { DetailsPanel } from '@/components/layout/DetailsPanel';
import { Header } from '@/components/layout/Header';
import { MainPanel } from '@/components/layout/MainPanel';
import { Sidebar } from '@/components/layout/Sidebar';
import { CloneDialog } from '@/components/repository/CloneDialog';
import { InitDialog } from '@/components/repository/InitDialog';
import { RepoSelector } from '@/components/repository/RepoSelector';
import { StashDialog } from '@/components/staging/StashDialog';
import { useRepoStore } from '@/stores/repoStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useUiStore } from '@/stores/uiStore';

function App() {
  const { repoInfo, error, clearError } = useRepoStore();
  const { theme, detailView, isDiffLoading } = useUiStore();
  const {
    addRecentRepo,
    sidebarWidth,
    detailsPanelHeight,
    setDetailsPanelHeight,
  } = useSettingsStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const showDetailsPanel = detailView !== 'none' || isDiffLoading;

  // Initialize theme
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Add to recent repos when opening
  useEffect(() => {
    if (repoInfo?.path) {
      addRecentRepo(repoInfo.path);
    }
  }, [repoInfo?.path, addRecentRepo]);

  // Show error toast
  useEffect(() => {
    if (error) {
      console.error('Git Client Error:', error);
      const timeout = setTimeout(() => clearError(), 5000);
      return () => clearTimeout(timeout);
    }
  }, [error, clearError]);

  // Listen for file system changes from the Rust watcher
  useEffect(() => {
    if (!repoInfo) return;

    let throttleTimer: ReturnType<typeof setTimeout> | null = null;
    const unlisten = listen('repo-changed', () => {
      if (throttleTimer) return;
      throttleTimer = setTimeout(() => {
        throttleTimer = null;
      }, 300);
      useRepoStore.getState().refreshAll();
    });

    return () => {
      unlisten.then((fn) => fn());
      if (throttleTimer) clearTimeout(throttleTimer);
    };
  }, [repoInfo]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newHeight = rect.bottom - e.clientY;
      const clamped = Math.max(100, Math.min(newHeight, rect.height - 100));
      setDetailsPanelHeight(clamped);
    };

    const handleMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [setDetailsPanelHeight]);

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      <Header />

      {error && (
        <div className="bg-destructive text-destructive-foreground px-4 py-2 text-sm">
          {error}
          <button type="button" className="ml-4 underline" onClick={clearError}>
            Dismiss
          </button>
        </div>
      )}

      <main className="flex-1 flex overflow-hidden">
        {!repoInfo ? (
          <RepoSelector />
        ) : (
          <>
            {/* Sidebar - Changes */}
            <div style={{ width: sidebarWidth }} className="flex-shrink-0">
              <Sidebar />
            </div>

            {/* Main content area - vertical split */}
            <div
              ref={containerRef}
              className="flex-1 flex flex-col overflow-hidden"
            >
              {/* Top panel - History */}
              <div className="flex-1 min-h-0 overflow-hidden">
                <MainPanel />
              </div>

              {/* Draggable divider + Details panel */}
              {showDetailsPanel && (
                <>
                  {/* biome-ignore lint/a11y/noStaticElementInteractions: resize drag handle */}
                  <div
                    className="flex-shrink-0 h-1 cursor-row-resize bg-border hover:bg-primary/50 transition-colors"
                    onMouseDown={handleMouseDown}
                  />
                  <div
                    style={{ height: detailsPanelHeight }}
                    className="flex-shrink-0 overflow-hidden border-t"
                  >
                    <DetailsPanel />
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </main>

      {/* Dialogs */}
      <CloneDialog />
      <InitDialog />
      <CreateBranchDialog />
      <StashDialog />
    </div>
  );
}

export default App;
