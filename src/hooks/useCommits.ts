import { useRepoStore } from "@/stores/repoStore";

export function useCommits() {
  const {
    commits,
    selectedCommit,
    refreshCommits,
    createCommit,
    selectCommit,
  } = useRepoStore();

  return {
    commits,
    selectedCommit,
    refreshCommits,
    createCommit,
    selectCommit,
  };
}
