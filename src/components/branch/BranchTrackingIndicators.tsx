interface BranchTrackingIndicatorsProps {
  ahead?: number | null;
  behind?: number | null;
}

export function BranchTrackingIndicators({
  ahead,
  behind,
}: BranchTrackingIndicatorsProps) {
  const aheadIndicator =
    ahead != null && ahead > 0 ? (
      <span
        className="font-mono text-xs shrink-0 text-git-added"
        title={`${ahead} commit${ahead === 1 ? '' : 's'} ahead of upstream (to push)`}
      >
        ↑{ahead}
      </span>
    ) : null;

  const behindIndicator =
    behind != null && behind > 0 ? (
      <span
        className="font-mono text-xs shrink-0 text-git-renamed"
        title={`${behind} commit${behind === 1 ? '' : 's'} behind upstream (to pull)`}
      >
        ↓{behind}
      </span>
    ) : null;

  return (
    <>
      {behindIndicator}
      {aheadIndicator}
    </>
  );
}
