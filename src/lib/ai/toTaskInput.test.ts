import { describe, expect, it } from 'vitest';
import { formatEstimate, suggestionToTaskInput } from './toTaskInput';
import { sanitizeData } from '../storage';
import type { PlanSuggestion } from './types';

const suggestion: PlanSuggestion = {
  key: 's0',
  title: 'Build core functionality: website',
  description: 'Focus on the most important part first.',
  priority: 'high',
  estimateMinutes: 90,
  dueDate: '2026-10-13',
  subtasks: ['Set up the workspace', 'Implement the main feature'],
  dateAdjusted: false,
};

describe('formatEstimate', () => {
  it.each([
    [15, '15m'],
    [45, '45m'],
    [60, '1h'],
    [90, '1h 30m'],
    [120, '2h'],
    [480, '8h'],
  ])('%i → %s', (minutes, label) => {
    expect(formatEstimate(minutes)).toBe(label);
  });
});

describe('suggestionToTaskInput', () => {
  it('maps every field', () => {
    const input = suggestionToTaskInput(suggestion, { projectId: 'p1', goal: 'Build my website by Tuesday', source: 'demo' });
    expect(input).toMatchObject({
      title: 'Build core functionality: website',
      status: 'todo',
      priority: 'high',
      dueDate: '2026-10-13',
      dueTime: null,
      projectId: 'p1',
      category: null,
      tags: ['ai-plan'],
      notes: '',
      recurrence: null,
    });
    expect(input.description).toBe(
      'Focus on the most important part first.\n\nEstimated time: 1h 30m\nPlanned with AI Planner (demo) from goal: "Build my website by Tuesday"',
    );
    expect(input.subtasks.map((s) => [s.title, s.done])).toEqual([
      ['Set up the workspace', false],
      ['Implement the main feature', false],
    ]);
    expect(new Set(input.subtasks.map((s) => s.id)).size).toBe(2);
  });

  it('labels AI plans and truncates the goal to 200 characters', () => {
    const goal = 'g'.repeat(300);
    const input = suggestionToTaskInput({ ...suggestion, description: '' }, { projectId: null, goal, source: 'ai' });
    expect(input.description).toBe(`Estimated time: 1h 30m\nPlanned with AI Planner (AI) from goal: "${'g'.repeat(200)}"`);
    expect(input.projectId).toBeNull();
  });

  it('survives sanitizeData unchanged', () => {
    const input = suggestionToTaskInput(suggestion, { projectId: 'p1', goal: 'Build my website', source: 'demo' });
    const now = '2026-10-11T09:00:00.000Z';
    const task = { ...input, id: 't1', order: 1024, createdAt: now, updatedAt: now, completedAt: null };
    const data = sanitizeData({
      version: 2,
      tasks: [task],
      projects: [{ id: 'p1', name: 'Website', description: '', color: '#8b5cf6', createdAt: now }],
      activity: [],
      notifications: [],
      notificationKeys: [],
      settings: {},
    });
    expect(data?.tasks[0]).toEqual(task);
  });
});
