import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface AiAgentManualInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

/**
 * Manual input section for custom agent prompts.
 * Supports Enter key submission (Shift+Enter for newline).
 */
export function AiAgentManualInput({ value, onChange, onSubmit }: AiAgentManualInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="space-y-3">
      <Textarea
        placeholder="Type your instruction for the agent..."
        value={value}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
        className="min-h-[100px] bg-zinc-900/50 border-zinc-800 focus:border-blue-500/50 resize-none"
        onKeyDown={handleKeyDown}
      />
      <div className="flex justify-end">
        <Button 
          onClick={onSubmit}
          disabled={!value.trim()}
          className="bg-blue-600 hover:bg-blue-500 text-white gap-2"
        >
          <Send className="w-4 h-4" />
          Send to IDE
        </Button>
      </div>
    </div>
  );
}
