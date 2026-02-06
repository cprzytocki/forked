import { useRepoStore } from "@/stores/repoStore";

export function useRepository() {
  const {
    repoInfo,
    status,
    isLoading,
    error,
    openRepository,
    initRepository,
    cloneRepository,
    closeRepository,
    refreshStatus,
    refreshAll,
    clearError,
  } = useRepoStore();

  return {
    repoInfo,
    status,
    isLoading,
    error,
    openRepository,
    initRepository,
    cloneRepository,
    closeRepository,
    refreshStatus,
    refreshAll,
    clearError,
  };
}
