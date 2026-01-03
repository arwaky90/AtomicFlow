import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';

export interface ZoneNodeData {
  label: string;
  color: string;
  bgColor?: string;
  width: number;
  height: number;
  type?: 'ring' | 'zone';
  [key: string]: unknown;
}

/** ZoneNode - Brighter background zones for Kingdom Mode */
export const ZoneNode = memo(({ data }: NodeProps) => {
  const { label, color, bgColor, width, height, type } = data as ZoneNodeData;

  const isRing = type === 'ring';

  return (
    <div
      className="select-none"
      style={{
        width: width || 1000,
        height: height || 400,
        backgroundColor: bgColor || color,
        borderRadius: isRing ? 24 : 16,
        border: `2px ${isRing ? 'solid' : 'dashed'} ${color}`,
        position: 'relative',
      }}
    >
      {/* Zone Label */}
      <div 
        className="absolute top-3 left-4 text-sm font-semibold tracking-wide"
        style={{ 
          color: color, 
          opacity: isRing ? 0.6 : 0.9,
          fontSize: isRing ? '12px' : '14px',
          letterSpacing: isRing ? '2px' : '1px',
          textTransform: isRing ? 'uppercase' : 'none',
        }}
      >
        {label}
      </div>
    </div>
  );
});

ZoneNode.displayName = 'ZoneNode';
