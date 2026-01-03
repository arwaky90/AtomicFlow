/**
 * RoleDropdown - Searchable dropdown for hexagonal role selection
 * Shows all 12 roles with emoji + label format
 */
import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import { ROLE_OPTIONS, ROLE_MAP, type RoleOption } from '@/domain/role/role_config';

interface RoleDropdownProps {
  currentRole: string;
  onSelect: (role: string) => void;
}

export function RoleDropdown({ currentRole, onSelect }: RoleDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter roles based on search
  const filteredRoles = useMemo(() => {
    if (!search) return ROLE_OPTIONS;
    return ROLE_OPTIONS.filter(r => 
      r.label.toLowerCase().includes(search.toLowerCase()) ||
      r.key.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (roleKey: string) => {
    onSelect(roleKey);
    setIsOpen(false);
    setSearch('');
  };

  const currentRoleData = ROLE_MAP[currentRole] || ROLE_MAP['default'];

  return (
    <div ref={dropdownRef} className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full flex items-center justify-between gap-2 px-3 py-2
          ${currentRoleData.bgColor} border border-zinc-700 rounded-lg
          hover:border-zinc-600 transition-colors
        `}
      >
        <span className={`text-sm font-medium ${currentRoleData.color}`}>
          {currentRoleData.emoji} {currentRoleData.label}
        </span>
        <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-1 z-50 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl overflow-hidden"
          >
            {/* Search Input */}
            <div className="p-2 border-b border-zinc-700">
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search roles..."
                className="w-full px-3 py-1.5 text-sm bg-zinc-900 border border-zinc-700 rounded-md text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-600"
              />
            </div>

            {/* Options List - compact to fit all 12 roles */}
            <div className="max-h-96 overflow-y-auto">
              {filteredRoles.map((role: RoleOption) => (
                <button
                  key={role.key}
                  onClick={() => handleSelect(role.key)}
                  className={`
                    w-full flex items-center justify-between gap-2 px-3 py-1.5
                    hover:bg-zinc-700/50 transition-colors text-left
                    ${role.key === currentRole ? role.bgColor : ''}
                  `}
                >
                  <span className={`text-xs ${role.color}`}>
                    {role.emoji} {role.label}
                  </span>
                  {role.key === currentRole && (
                    <Check className="w-3 h-3 text-green-400" />
                  )}
                </button>
              ))}
              
              {filteredRoles.length === 0 && (
                <div className="px-3 py-4 text-sm text-zinc-500 text-center">
                  No roles found
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
