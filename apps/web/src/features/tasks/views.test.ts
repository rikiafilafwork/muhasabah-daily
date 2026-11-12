import { describe, expect, it } from 'vitest';
import { defaultsForView, parseView, queryForView } from './views';

describe('task views', () => {
  it('parseView menerima tampilan dikenal dan proyek', () => {
    expect(parseView('overdue')).toBe('overdue');
    expect(parseView('project:abc123')).toBe('project:abc123');
    expect(parseView('project:')).toBe('focus');
    expect(parseView('ngawur')).toBe('focus');
    expect(parseView(undefined)).toBe('focus');
  });
  it('memetakan tampilan ke kueri dan nilai awal', () => {
    expect(queryForView('inbox')).toEqual({ projectId: 'none' });
    expect(queryForView('project:p1')).toEqual({ projectId: 'p1' });
    expect(defaultsForView('today', '2026-11-12')).toEqual({ dueDate: '2026-11-12' });
    expect(defaultsForView('project:p1', '2026-11-12')).toEqual({ projectId: 'p1' });
    expect(defaultsForView('done', '2026-11-12')).toEqual({});
  });
});
