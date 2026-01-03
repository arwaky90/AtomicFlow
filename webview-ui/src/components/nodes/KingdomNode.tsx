/**
 * KingdomNode - 2D Flat Node for Dependency Mode
 * Shows role with colored icon badge, LOC count, and file name
 */
import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import { 
  Crown, Scale, Gem, Cog, ShieldHalf, Wrench,
  Building2, HandMetal, Ship, Boxes, Brush, Eye, Sparkles
} from 'lucide-react';

export interface KingdomNodeData extends Record<string, unknown> {
  label: string;
  path: string;
  role: 'core' | 'entity' | 'value_object' | 'factory' | 'port' | 'composable' | 'component' | 'driving' | 'driven' | 'assets' | 'styles' | 'utils' | 'default';
  loc?: number; 
  importance?: number;
}

// 12 Role Icons
const RoleIcons = {
  core: Crown,
  entity: Scale,
  value_object: Gem,
  factory: Cog,
  port: ShieldHalf,
  composable: Wrench,
  component: Building2,
  driving: HandMetal,
  driven: Ship,
  assets: Boxes,
  styles: Brush,
  utils: Eye,
  default: Sparkles,
};

// 12 Role Colors (HSL for consistency)
const RoleColors = {
  core: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/50', text: 'text-yellow-400' },
  entity: { bg: 'bg-orange-500/20', border: 'border-orange-500/50', text: 'text-orange-400' },
  value_object: { bg: 'bg-emerald-500/20', border: 'border-emerald-500/50', text: 'text-emerald-400' },
  factory: { bg: 'bg-amber-500/20', border: 'border-amber-500/50', text: 'text-amber-400' },
  port: { bg: 'bg-red-500/20', border: 'border-red-500/50', text: 'text-red-400' },
  composable: { bg: 'bg-purple-500/20', border: 'border-purple-500/50', text: 'text-purple-400' },
  component: { bg: 'bg-cyan-500/20', border: 'border-cyan-500/50', text: 'text-cyan-400' },
  driving: { bg: 'bg-green-500/20', border: 'border-green-500/50', text: 'text-green-400' },
  driven: { bg: 'bg-blue-500/20', border: 'border-blue-500/50', text: 'text-blue-400' },
  assets: { bg: 'bg-slate-500/20', border: 'border-slate-500/50', text: 'text-slate-400' },
  styles: { bg: 'bg-pink-500/20', border: 'border-pink-500/50', text: 'text-pink-400' },
  utils: { bg: 'bg-teal-500/20', border: 'border-teal-500/50', text: 'text-teal-400' },
  default: { bg: 'bg-zinc-500/20', border: 'border-zinc-500/50', text: 'text-zinc-400' },
};

function KingdomNodeComponent({ data, selected }: NodeProps<Node<KingdomNodeData>>) {
  const { label, role = 'default', loc = 0 } = data as KingdomNodeData;
  
  const Icon = RoleIcons[role] || RoleIcons.default;
  const colors = RoleColors[role] || RoleColors.default;

  return (
    <div 
      className={`
        relative px-4 py-3 rounded-xl
        ${colors.bg} ${colors.border} border-2
        backdrop-blur-sm
        min-w-[140px] max-w-[200px]
        transition-all duration-200
        ${selected ? 'ring-2 ring-white/50 scale-105' : 'hover:scale-102'}
      `}
    >
      {/* Handle Top */}
      <Handle 
        type="target" 
        position={Position.Top} 
        className="!w-2 !h-2 !bg-zinc-400 !border-zinc-600"
      />

      {/* Content */}
      <div className="flex items-center gap-3">
        {/* Icon Badge */}
        <div className={`p-2 rounded-lg ${colors.bg} border ${colors.border}`}>
          <Icon className={`w-5 h-5 ${colors.text}`} strokeWidth={2} />
        </div>

        {/* Text */}
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-medium text-zinc-100 truncate">
            {label}
          </span>
          <span className="text-xs text-zinc-500">
            {loc} LOC
          </span>
        </div>
      </div>

      {/* Handle Bottom */}
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="!w-2 !h-2 !bg-zinc-400 !border-zinc-600"
      />
    </div>
  );
}

export const KingdomNode = memo(KingdomNodeComponent);
