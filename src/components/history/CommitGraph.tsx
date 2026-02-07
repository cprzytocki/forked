import type { GraphNode } from "@/lib/types";
import { getBranchColorHsl } from "@/lib/utils";

const LANE_WIDTH = 16;
const NODE_RADIUS = 4;
const MERGE_RADIUS = 5;
const ROW_HEIGHT = 36;

interface CommitGraphProps {
  node: GraphNode;
  maxLanes: number;
}

export function CommitGraph({ node, maxLanes }: CommitGraphProps) {
  const width = Math.max((maxLanes + 1) * LANE_WIDTH, LANE_WIDTH * 3);
  const centerY = ROW_HEIGHT / 2;
  const nodeX = node.lane * LANE_WIDTH + LANE_WIDTH / 2;
  const color = getBranchColorHsl(node.color_index);

  return (
    <svg
      width={width}
      height={ROW_HEIGHT}
      className="flex-shrink-0"
      style={{ minWidth: width }}
    >
      {/* Draw pass-through lane lines (behind everything) */}
      {node.pass_through_lanes.map((pt) => {
        const ptX = pt.lane * LANE_WIDTH + LANE_WIDTH / 2;
        const ptColor = getBranchColorHsl(pt.color_index);
        return (
          <line
            key={`pt-${pt.lane}`}
            x1={ptX}
            y1={0}
            x2={ptX}
            y2={ROW_HEIGHT}
            stroke={ptColor}
            strokeWidth={2}
          />
        );
      })}

      {/* Draw connections to parents */}
      {node.connections_to_parents.map((conn, i) => {
        const fromX = conn.from_lane * LANE_WIDTH + LANE_WIDTH / 2;
        const toX = conn.to_lane * LANE_WIDTH + LANE_WIDTH / 2;
        const connColor = getBranchColorHsl(conn.color_index);

        if (fromX === toX) {
          // Straight vertical line
          return (
            <line
              key={i}
              x1={fromX}
              y1={centerY}
              x2={toX}
              y2={ROW_HEIGHT}
              stroke={connColor}
              strokeWidth={2}
            />
          );
        } else {
          const isBranchOut = conn.from_lane === node.lane;
          if (isBranchOut) {
            // Branch out: curve from node down to target lane at bottom
            const midY = centerY + (ROW_HEIGHT - centerY) * 0.5;
            return (
              <path
                key={i}
                d={`M ${fromX} ${centerY} C ${fromX} ${midY}, ${toX} ${midY}, ${toX} ${ROW_HEIGHT}`}
                fill="none"
                stroke={connColor}
                strokeWidth={2}
              />
            );
          } else {
            // Converge in: curve from source lane at top down to node at centerY
            const midY = centerY * 0.5;
            return (
              <path
                key={i}
                d={`M ${fromX} ${0} C ${fromX} ${midY}, ${toX} ${midY}, ${toX} ${centerY}`}
                fill="none"
                stroke={connColor}
                strokeWidth={2}
              />
            );
          }
        }
      })}

      {/* Draw vertical line above node (coming from previous row) */}
      <line
        x1={nodeX}
        y1={0}
        x2={nodeX}
        y2={centerY}
        stroke={color}
        strokeWidth={2}
      />

      {/* Draw the commit node */}
      {node.is_merge ? (
        <circle
          cx={nodeX}
          cy={centerY}
          r={MERGE_RADIUS}
          fill="hsl(var(--background))"
          stroke={color}
          strokeWidth={2.5}
        />
      ) : (
        <circle
          cx={nodeX}
          cy={centerY}
          r={NODE_RADIUS}
          fill={color}
        />
      )}
    </svg>
  );
}
