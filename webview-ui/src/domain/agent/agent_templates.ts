/**
 * agent_templates.ts - Predefined Agent Roles and Templates
 */

export interface AgentTemplate {
    id: string;
    label: string;
    emoji: string;
    role: string;
    description: string;
    promptPrefix: string;
}

export const AGENT_TEMPLATES: AgentTemplate[] = [
    {
        id: 'architect',
        label: 'System Architect',
        emoji: '🏗️',
        role: 'Senior Software Architect',
        description: 'Focus on Hexagonal Architecture, modularity, and scalability.',
        promptPrefix: 'As a Senior Software Architect specializing in Hexagonal Architecture, please analyze this: '
    },
    {
        id: 'refactor',
        label: 'Refactoring Expert',
        emoji: '🧹',
        role: 'Refactoring Specialist',
        description: 'Focus on clean code, SRP, and reducing complexity.',
        promptPrefix: 'As a Refactoring Specialist, please identifying code smells and suggest improvements for: '
    },
    {
        id: 'security',
        label: 'Security Auditor',
        emoji: '🛡️',
        role: 'Security Engineer',
        description: 'Identify vulnerabilities and potential security risks.',
        promptPrefix: 'As a Security Engineer, please audit this for vulnerabilities: '
    },
    {
        id: 'test',
        label: 'Test Engineer',
        emoji: '🧪',
        role: 'QA Automation Engineer',
        description: 'Suggest unit and integration tests.',
        promptPrefix: 'As a QA Automation Engineer, please create test cases for: '
    }
];
