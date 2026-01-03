import type { AgentTemplate } from '@/domain/agent/agent_templates';

interface AiAgentTemplateGridProps {
  templates: readonly AgentTemplate[];
  onTemplateClick: (template: AgentTemplate) => void;
}

/**
 * Grid display of agent role templates.
 * Each template triggers an agent action with a pre-defined prompt.
 */
export function AiAgentTemplateGrid({ templates, onTemplateClick }: AiAgentTemplateGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {templates.map((template) => (
        <button
          key={template.id}
          onClick={() => onTemplateClick(template)}
          className="flex flex-col items-start gap-2 p-3 rounded-lg border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 hover:border-blue-500/50 transition-all text-left group"
        >
          <span className="text-2xl group-hover:scale-110 transition-transform">
            {template.emoji}
          </span>
          <div>
            <div className="font-semibold text-sm text-zinc-200">
              {template.label}
            </div>
            <div className="text-[10px] text-zinc-500 line-clamp-2">
              {template.description}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
