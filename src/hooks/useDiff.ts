import { useUiStore } from '@/stores/uiStore';

export function useDiff() {
  const {
    currentFileDiff,
    currentCommitDiff,
    isDiffLoading,
    loadFileDiff,
    loadCommitDiff,
    clearDiff,
  } = useUiStore();

  return {
    currentFileDiff,
    currentCommitDiff,
    isDiffLoading,
    loadFileDiff,
    loadCommitDiff,
    clearDiff,
  };
}
