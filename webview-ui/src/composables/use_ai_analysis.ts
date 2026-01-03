/**
 * use_ai_analysis
 * Composable for AI-powered node classification and auto-organization.
 */

import { useState, useCallback } from 'react';
import { GeminiService } from '@/services/gemini_service';
import { useGraphStore } from '@/store/graphStore';
import { HUD_CONFIG } from '@/domain/hud';

declare const acquireVsCodeApi: () => { postMessage: (msg: unknown) => void };

interface UseAiAnalysisResult {
  /** Whether AI analysis is currently in progress */
  isAnalyzing: boolean;
  /** Trigger AI analysis on unknown/other nodes */
  handleAiAnalysis: () => Promise<void>;
}

/**
 * Hook for managing AI-based file role analysis.
 * Uses Gemini API to classify unclassified nodes and optionally move them.
 */
export function useAiAnalysis(): UseAiAnalysisResult {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const graphStore = useGraphStore();

  const handleAiAnalysis = useCallback(async () => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);

    try {
      // 1. Identify "Other" or unknown nodes
      const allNodes = graphStore.nodes;
      const unknownNodes = allNodes.filter(
        n => n.type === 'file' && (!n.data.role || n.data.role === 'other' || n.data.role === 'unknown')
      );

      console.log('🤖 AI Agent: Found unknown nodes:', unknownNodes.length);

      if (unknownNodes.length === 0) {
        alert('All nodes are already classified! 🎉');
        setIsAnalyzing(false);
        return;
      }

      // 2. Get API key
      const apiKey = GeminiService.getApiKey();
      if (!apiKey) {
        alert('API Key missing');
        setIsAnalyzing(false);
        return;
      }

      // 3. Process nodes in batch
      const nodesToAnalyze = unknownNodes.slice(0, HUD_CONFIG.AI_BATCH_SIZE);
      const vscode = acquireVsCodeApi();
      
      for (const node of nodesToAnalyze) {
        // Request content via VS Code extension
        vscode.postMessage({ command: 'getFileContent', path: node.id });
        
        // Wait for content with timeout
        const content = await new Promise<string>((resolve) => {
          const handler = (event: MessageEvent) => {
            const msg = event.data;
            if (msg.command === 'fileContent' && msg.path === node.id) {
              window.removeEventListener('message', handler);
              resolve(msg.content);
            }
          };
          window.addEventListener('message', handler);
          
          // Timeout fallback
          setTimeout(() => {
            window.removeEventListener('message', handler);
            resolve(''); 
          }, HUD_CONFIG.ANALYSIS_TIMEOUT_MS);
        });

        if (content) {
          console.log(`🤖 Analyzing ${node.data.label}...`);
          const result = await GeminiService.analyzeFileRole(
            node.data.label as string, 
            content, 
            apiKey
          );
          
          console.log('✨ Analysis Result:', result);
          
          if (result.role && result.suggestedPath) {
            // Update graph store UI immediately
            graphStore.updateNodeData(node.id, { 
              role: result.role,
            });

            // Auto-move file if confidence is high
            if (result.confidence > HUD_CONFIG.AUTO_MOVE_CONFIDENCE_THRESHOLD) {
              vscode.postMessage({
                command: 'moveNode',
                oldPath: node.id,
                newDir: result.suggestedPath
              });
            }
          }
        }
      }

      alert(`Analysis Complete! Processed ${nodesToAnalyze.length} files.`);

    } catch (error) {
      console.error('AI Analysis Failed:', error);
      alert('AI Analysis failed. See console.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing, graphStore]);

  return {
    isAnalyzing,
    handleAiAnalysis,
  };
}
