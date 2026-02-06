import React, { useEffect } from "react";
import { useRepoStore } from "@/stores/repoStore";
import { useUiStore } from "@/stores/uiStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { MainPanel } from "@/components/layout/MainPanel";
import { DetailsPanel } from "@/components/layout/DetailsPanel";
import { BranchList } from "@/components/branch/BranchList";
import { RepoSelector } from "@/components/repository/RepoSelector";
import { CloneDialog } from "@/components/repository/CloneDialog";
import { InitDialog } from "@/components/repository/InitDialog";
import { CreateBranchDialog } from "@/components/branch/CreateBranchDialog";
import { StashDialog } from "@/components/staging/StashDialog";

function App() {
  const { repoInfo, error, clearError } = useRepoStore();
  const { theme, setTheme, viewMode } = useUiStore();
  const { addRecentRepo, sidebarWidth, detailsPanelWidth } = useSettingsStore();

  // Initialize theme
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
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
      console.error("Git Client Error:", error);
      // Could add a toast notification here
      const timeout = setTimeout(() => clearError(), 5000);
      return () => clearTimeout(timeout);
    }
  }, [error, clearError]);

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      <Header />

      {error && (
        <div className="bg-destructive text-destructive-foreground px-4 py-2 text-sm">
          {error}
          <button
            className="ml-4 underline"
            onClick={clearError}
          >
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

            {/* Main content area */}
            <div className="flex-1 flex overflow-hidden">
              {/* Middle panel - History or Branches */}
              <div className="flex-1 border-r">
                {viewMode === "branches" ? (
                  <BranchList />
                ) : (
                  <MainPanel />
                )}
              </div>

              {/* Details panel - Diff viewer */}
              <div style={{ width: detailsPanelWidth }} className="flex-shrink-0">
                <DetailsPanel />
              </div>
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
