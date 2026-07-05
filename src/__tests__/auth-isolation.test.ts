import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PATCH } from '@/app/api/debts/[id]/route';
import { db } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/api-auth';

vi.mock('@/lib/db', () => ({
  db: {
    debt: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('@/lib/api-auth', () => ({
  getUserIdFromRequest: vi.fn(),
}));

// Mock logger to avoid console spam in tests
vi.mock('@/lib/logger', () => ({
  logError: vi.fn(),
}));

describe('Auth Isolation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('prevents User A from modifying User B debt via PATCH', async () => {
    // User A is making the request
    vi.mocked(getUserIdFromRequest).mockReturnValue('user-A');

    // The requested debt actually belongs to User B
    vi.mocked(db.debt.findUnique).mockResolvedValue({
      id: 'debt-123',
      userId: 'user-B',
      name: 'Test Debt',
      principal: 1000,
      apr: 10,
      minimum_payment: 50,
      type: 'credit_card',
      archived_at: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const req = new Request('http://localhost/api/debts/debt-123', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Hacked Name' }),
    });

    const res = await PATCH(req, { params: { id: 'debt-123' } });

    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe('Forbidden');
    expect(db.debt.update).not.toHaveBeenCalled();
  });
});
