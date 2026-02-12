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
    setSidebarWidth,
    detailsPanelHeight,
    setDetailsPanelHeight,
  } = useSettingsStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const isSidebarDragging = useRef(false);

  const showDetailsPanel = detailView !== 'none' || isDiffLoading;

  // Initialize theme
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Auto-open most recent repository on startup
  useEffect(() => {
    const recentRepos = useSettingsStore.getState().recentRepos;
    if (recentRepos.length > 0 && !useRepoStore.getState().repoInfo) {
      useRepoStore.getState().openRepository(recentRepos[0]);
    }
  }, []);

  // Add to recent repos when opening
  useEffect(() => {
    if (repoInfo?.path) {
      addRecentRepo(repoInfo.path);
    }
  }, [repoInfo?.path, addRecentRepo]);

  // Show error toast
  useEffect(() => {
    if (error) {
      console.error('Forked Error:', error);
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

  const handleSidebarMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isSidebarDragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isSidebarDragging.current) {
        const newWidth = e.clientX;
        const clamped = Math.max(215, Math.min(newWidth, 480));
        setSidebarWidth(clamped);
        return;
      }
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
      if (isSidebarDragging.current) {
        isSidebarDragging.current = false;
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
  }, [setDetailsPanelHeight, setSidebarWidth]);

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      <Header />

      {error && (
        <div className="mx-3 mt-3 rounded-lg border border-destructive/30 bg-destructive/90 px-4 py-2 text-sm text-destructive-foreground shadow-soft backdrop-blur-md">
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

            {/* Sidebar resize handle */}
            <div className="relative h-full w-px flex-shrink-0 bg-border/70 transition-colors hover:bg-primary/60">
              <button
                type="button"
                aria-label="Resize sidebar"
                className="absolute inset-y-0 -left-2 -right-2 cursor-col-resize"
                onMouseDown={handleSidebarMouseDown}
              />
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
                  <div className="relative h-px flex-shrink-0 bg-border/70 transition-colors hover:bg-primary/60">
                    <button
                      type="button"
                      aria-label="Resize details panel"
                      className="absolute inset-x-0 -top-2 -bottom-2 cursor-row-resize"
                      onMouseDown={handleMouseDown}
                    />
                  </div>
                  <div
                    style={{ height: detailsPanelHeight }}
                    className="flex-shrink-0 overflow-hidden"
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
