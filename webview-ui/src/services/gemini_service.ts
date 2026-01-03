import { HEXAGONAL_FOLDERS } from '@/domain/scaffold';

export interface RoleAnalysisResult {
  role: string;
  confidence: number;
  reason: string;
  suggestedPath?: string;
}

export class GeminiService {
  private static readonly API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
  private static readonly STORAGE_KEY = 'atomic_flow_gemini_key';

  static getApiKey(): string | null {
    return localStorage.getItem(this.STORAGE_KEY);
  }

  static saveApiKey(key: string) {
    localStorage.setItem(this.STORAGE_KEY, key);
  }

  static hasApiKey(): boolean {
    return !!this.getApiKey();
  }

  static async analyzeFileRole(
    filename: string, 
    content: string, 
    apiKey: string
  ): Promise<RoleAnalysisResult> {
    const rolesDescription = HEXAGONAL_FOLDERS.map(f => 
      `- ${f.role} (${f.emoji}): ${f.description} (Path: ${f.path})`
    ).join('\n');

    const prompt = `
      You are a Senior Software Architect specializing in Hexagonal Architecture.
      Your task is to classify the following code file into EXACTLY ONE of these 12 roles:
      
      ${rolesDescription}

      File Name: "${filename}"
      Code Content (first 100 lines):
      \`\`\`typescript
      ${content.slice(0, 3000)}
      \`\`\`

      Analyze the imports, class names, and logic.
      Return a JSON object with this structure (no markdown formatting):
      {
        "role": "one_of_the_role_ids_above",
        "confidence": number_between_0_and_1,
        "reason": "short_explanation_why",
        "suggestedPath": "suggested_folder_path_from_list"
      }
    `;

    try {
      const response = await fetch(`${this.API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' }
        })
      });

      if (!response.ok) {
        // Detailed error logging
        const errorText = await response.text();
        console.error('Gemini API Error Detail:', errorText);
        throw new Error(`Gemini API Error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!text) {
         console.error('Gemini Empty Response:', data);
         throw new Error('No response content from Gemini');
      }
      
      return JSON.parse(text) as RoleAnalysisResult;
    } catch (error) {
      console.error('AI Analysis failed:', error);
      throw error;
    }
  }
}
