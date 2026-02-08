import { useRepoStore } from '@/stores/repoStore';

export function useBranches() {
  const {
    branches,
    currentBranch,
    refreshBranches,
    createBranch,
    checkoutBranch,
    deleteBranch,
    mergeBranch,
  } = useRepoStore();

  return {
    branches,
    currentBranch,
    refreshBranches,
    createBranch,
    checkoutBranch,
    deleteBranch,
    mergeBranch,
  };
}
