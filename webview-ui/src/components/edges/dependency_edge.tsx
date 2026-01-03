import { memo } from 'react';
import { BaseEdge, getBezierPath, EdgeLabelRenderer } from '@xyflow/react';
import type { EdgeProps, Edge } from '@xyflow/react';

export interface DependencyEdgeData extends Record<string, unknown> {
  weight?: number;
  isCircular?: boolean;
  importType?: 'default' | 'named' | 'namespace';
}

export type DependencyEdgeType = Edge<DependencyEdgeData, 'dependency'>;

/** DependencyEdge - Animated import connection with weight visualization */
function DependencyEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps<DependencyEdgeType>) {
  const edgeData = data as DependencyEdgeData | undefined;
  const weight = edgeData?.weight ?? 1;
  const isCircular = edgeData?.isCircular ?? false;

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Dynamic stroke width based on dependency weight
  const strokeWidth = Math.min(1 + weight * 0.5, 4);

  // Color based on edge type
  const strokeColor = isCircular 
    ? '#ef4444' // Red for circular deps
    : selected 
      ? '#3b82f6' // Blue when selected
      : '#6b7280'; // Gray default

  return (
    <>
      {/* Main Edge Path */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: strokeColor,
          strokeWidth,
          strokeLinecap: 'round',
        }}
      />

      {/* Animated Particle Flow */}
      <circle
        r={3}
        fill={strokeColor}
        style={{
          offsetPath: `path("${edgePath}")`,
          animation: `flowParticle ${2 / weight}s linear infinite`,
        }}
      />

      {/* Weight Label */}
      {weight > 1 && (
        <EdgeLabelRenderer>
          <div
            className="absolute px-1.5 py-0.5 bg-zinc-800 border border-zinc-600 rounded text-xs text-zinc-300 pointer-events-none nodrag nopan"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
          >
            ×{weight}
          </div>
        </EdgeLabelRenderer>
      )}

      {/* Circular Dependency Warning */}
      {isCircular && (
        <EdgeLabelRenderer>
          <div
            className="absolute px-1.5 py-0.5 bg-red-900/80 border border-red-500 rounded text-xs text-red-300 pointer-events-none nodrag nopan"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY - 20}px)`,
            }}
          >
            ⚠️ Circular
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export const DependencyEdge = memo(DependencyEdgeComponent);
