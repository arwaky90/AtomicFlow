/**
 * PropertiesPanel - Right sidebar showing selected node info
 * Refactored: Extracted RoleDropdown and role config to separate modules
 */
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileCode, MapPin, ArrowDown, ArrowUp, Layers } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RoleDropdown } from '@/components/ui/role_dropdown';
import { getRoleFromPath } from '@/domain/role/role_config';

export interface PropertiesPanelProps {
  node: {
    id: string;
    label: string;
    path?: string;
    type?: string;
    lineCount?: number;
    imports?: string[];
    exports?: string[];
    role?: string;
  } | null;
  onClose: () => void;
  onInspect: (path: string) => void;
  onRoleChange?: (nodeId: string, role: string) => void;
}

/** PropertiesPanel - Right sidebar showing selected node info */
export function PropertiesPanel({ node, onClose, onInspect, onRoleChange }: PropertiesPanelProps) {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const prevNodeIdRef = useRef(node?.id);

  // Reset selected role when node changes - using ref pattern instead of useEffect
  if (node?.id !== prevNodeIdRef.current) {
    prevNodeIdRef.current = node?.id;
    if (selectedRole !== null) {
      setSelectedRole(null);
    }
  }

  if (!node) return null;

  const defaultRole = node.role || getRoleFromPath(node.path || '');
  const currentRole = selectedRole || defaultRole;

  const handleRoleChange = (newRole: string) => {
    setSelectedRole(newRole);
    onRoleChange?.(node.id, newRole);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: 300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 300, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="absolute right-0 top-0 bottom-0 w-72 bg-background/95 backdrop-blur-xl border-l border-border shadow-2xl z-50 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <FileCode className="w-5 h-5 text-primary" />
            <span className="font-semibold text-sm">Properties</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-7 w-7"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* File Name */}
          <div>
            <span className="text-xs text-muted-foreground uppercase tracking-wide">
              Name
            </span>
            <p className="text-sm font-medium mt-1 truncate">{node.label}</p>
          </div>

          {/* Path */}
          {node.path && (
            <div>
              <span className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                Path
              </span>
              <p className="text-xs text-muted-foreground mt-1 font-mono break-all">
                {node.path}
              </p>
            </div>
          )}

          {/* Role Dropdown */}
          <div>
            <span className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1 mb-2">
              <Layers className="w-3 h-3" />
              Role
            </span>
            <RoleDropdown 
              currentRole={currentRole} 
              onSelect={handleRoleChange}
            />
          </div>

          {/* Stats */}
          {node.lineCount && (
            <div className="grid grid-cols-3 gap-2">
              <Card className="p-2 text-center bg-zinc-800/50">
                <span className="text-lg font-bold">{node.lineCount}</span>
                <span className="text-xs text-muted-foreground block">Lines</span>
              </Card>
              <Card className="p-2 text-center bg-zinc-800/50">
                <span className="text-lg font-bold flex items-center justify-center gap-1">
                  <ArrowDown className="w-3 h-3" />
                  {node.imports?.length || 0}
                </span>
                <span className="text-xs text-muted-foreground block">Imports</span>
              </Card>
              <Card className="p-2 text-center bg-zinc-800/50">
                <span className="text-lg font-bold flex items-center justify-center gap-1">
                  <ArrowUp className="w-3 h-3" />
                  {node.exports?.length || 0}
                </span>
                <span className="text-xs text-muted-foreground block">Exports</span>
              </Card>
            </div>
          )}

          {/* Imports List */}
          {node.imports && node.imports.length > 0 && (
            <div>
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                Imports
              </span>
              <ul className="mt-2 space-y-1">
                {node.imports.slice(0, 8).map((imp, i) => (
                  <li
                    key={i}
                    className="text-xs font-mono text-zinc-400 truncate"
                  >
                    {imp}
                  </li>
                ))}
                {node.imports.length > 8 && (
                  <li className="text-xs text-muted-foreground">
                    +{node.imports.length - 8} more...
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border">
          <Button
            className="w-full"
            onClick={() => node.path && onInspect(node.path)}
          >
            <FileCode className="w-4 h-4 mr-2" />
            Open in Editor
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
