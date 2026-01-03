import { describe, it, expect } from 'vitest';
import { getComplexityColor, getFileIcon } from '../atomic_flow_node_service';
import { FileCode, FileJson, Braces, FileText } from 'lucide-react';

describe('atomic_flow_node_service', () => {
  describe('getComplexityColor', () => {
    it('returns ideal for < 200 lines', () => {
      expect(getComplexityColor(100)).toBe('ideal');
    });

    it('returns moderate for 200-299 lines', () => {
      expect(getComplexityColor(250)).toBe('moderate');
    });

    it('returns warning for 300-499 lines', () => {
      expect(getComplexityColor(400)).toBe('warning');
    });

    it('returns danger for >= 500 lines', () => {
      expect(getComplexityColor(600)).toBe('danger');
    });
  });

  describe('getFileIcon', () => {
    it('returns FileCode for ts/js files', () => {
      expect(getFileIcon('file.ts')).toBe(FileCode);
      expect(getFileIcon('file.tsx')).toBe(FileCode);
      expect(getFileIcon('file.js')).toBe(FileCode);
    });

    it('returns FileJson for json files', () => {
      expect(getFileIcon('file.json')).toBe(FileJson);
    });

    it('returns Braces for vue files', () => {
      expect(getFileIcon('file.vue')).toBe(Braces);
    });

    it('returns FileText for unknown extensions', () => {
      expect(getFileIcon('file.txt')).toBe(FileText);
      expect(getFileIcon('makefile')).toBe(FileText);
    });
  });
});
