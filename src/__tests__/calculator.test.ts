import { describe, it, expect } from 'vitest';
import { calculatePayoff, DebtInput } from '@/lib/calculator';

describe('Calculator Engine', () => {
  const debts: DebtInput[] = [
    { id: '1', name: 'Credit Card', principal: 5000, apr: 20, minimum_payment: 100 },
    { id: '2', name: 'Personal Loan', principal: 10000, apr: 10, minimum_payment: 200 },
  ];

  it('calculates Avalanche correctly', () => {
    const result = calculatePayoff(debts, 500, 'avalanche');
    expect(result.payoff_exceeds_horizon).toBe(false);
    expect(result.debts.length).toBe(2);
    
    const cc = result.debts.find(d => d.id === '1');
    const pl = result.debts.find(d => d.id === '2');
    expect(cc!.payoff_month).toBeLessThan(pl!.payoff_month);
    expect(result.months_to_payoff).toBeGreaterThan(0);
    expect(result.total_interest).toBeGreaterThan(0);
  });

  it('calculates Snowball correctly', () => {
    const result = calculatePayoff(debts, 500, 'snowball');
    expect(result.payoff_exceeds_horizon).toBe(false);
    const cc = result.debts.find(d => d.id === '1');
    const pl = result.debts.find(d => d.id === '2');
    expect(cc!.payoff_month).toBeLessThan(pl!.payoff_month);
  });

  it('handles budget shortfall gracefully', () => {
    expect(() => calculatePayoff(debts, 200, 'avalanche')).toThrow('Budget shortfall of 100');
  });

  it('caps at 600 months (payoff_exceeds_horizon)', () => {
    const hugeDebts: DebtInput[] = [
      { id: '3', name: 'Huge', principal: 1000000, apr: 20, minimum_payment: 100 },
    ];
    const result = calculatePayoff(hugeDebts, 100, 'avalanche');
    expect(result.payoff_exceeds_horizon).toBe(true);
    expect(result.months_to_payoff).toBe(600);
  });

  it('simulates lump sum correctly', () => {
    const result = calculatePayoff(debts, 500, 'avalanche', 5000, '1');
    const cc = result.debts.find(d => d.id === '1');
    expect(cc!.payoff_month).toBe(1); 
  });
});
