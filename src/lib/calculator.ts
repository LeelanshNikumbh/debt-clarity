export type DebtInput = {
  id: string;
  name: string;
  principal: number;
  apr: number;
  minimum_payment: number;
};

export type DebtResult = {
  id: string;
  payoff_month: number;
  interest_paid: number;
};

export type CalculationResult = {
  payoff_exceeds_horizon: boolean;
  total_interest: number;
  months_to_payoff: number;
  debts: DebtResult[];
  timeline: { month: number; totalBalance: number }[];
};

export function calculatePayoff(
  debts: DebtInput[],
  monthly_budget: number,
  strategy: 'avalanche' | 'snowball',
  extra_lump_sum: number = 0,
  lump_sum_target_id?: string
): CalculationResult {
  const sumMins = debts.reduce((sum, d) => sum + d.minimum_payment, 0);
  if (monthly_budget < sumMins) {
    throw new Error(`Budget shortfall of ${sumMins - monthly_budget}`);
  }

  // Clone debts for simulation
  let currentDebts = debts.map(d => ({ ...d, interest_paid: 0, payoff_month: 0, active: true }));

  if (extra_lump_sum > 0 && lump_sum_target_id) {
    const target = currentDebts.find(d => d.id === lump_sum_target_id);
    if (target) {
      target.principal = Math.max(0, target.principal - extra_lump_sum);
      if (target.principal === 0) {
        target.active = false;
        target.payoff_month = 1;
      }
    }
  }

  let total_interest = 0;
  let months = 0;
  const max_months = 600; // 50 years horizon cap
  const timeline: { month: number; totalBalance: number }[] = [];

  while (currentDebts.some(d => d.active) && months < max_months) {
    months++;
    let current_budget = monthly_budget;
    
    // Sort active debts based on strategy for extra payment targeting
    const activeDebts = currentDebts.filter(d => d.active);
    
    if (strategy === 'avalanche') {
      activeDebts.sort((a, b) => b.apr - a.apr); // highest APR first
    } else {
      activeDebts.sort((a, b) => a.principal - b.principal); // lowest principal first
    }

    let balanceThisMonth = 0;

    // 1. Accrue interest and pay minimums
    for (let debt of activeDebts) {
      const monthly_rate = (debt.apr / 100) / 12;
      const interest_this_month = debt.principal * monthly_rate;
      debt.interest_paid += interest_this_month;
      total_interest += interest_this_month;
      
      debt.principal += interest_this_month;
      
      let min_payment = Math.min(debt.minimum_payment, debt.principal);
      
      if (current_budget >= min_payment) {
        debt.principal -= min_payment;
        current_budget -= min_payment;
      } else {
        // Budget is somehow exhausted by minimums (shouldn't happen due to initial check, unless rates caused principal growth exceeding budget)
        debt.principal -= current_budget;
        current_budget = 0;
      }
    }

    // 2. Apply remaining budget (extra) to target debt
    if (current_budget > 0) {
      for (let debt of activeDebts) {
        if (current_budget <= 0) break;
        if (debt.principal > 0) {
          const extra_payment = Math.min(current_budget, debt.principal);
          debt.principal -= extra_payment;
          current_budget -= extra_payment;
        }
      }
    }

    // 3. Check payoffs
    for (let debt of activeDebts) {
      if (debt.principal <= 0.01) { // Floating point precision
        debt.principal = 0;
        debt.active = false;
        debt.payoff_month = months;
      }
      balanceThisMonth += debt.principal;
    }

    timeline.push({ month: months, totalBalance: balanceThisMonth });
  }

  const results: DebtResult[] = currentDebts.map(d => ({
    id: d.id,
    payoff_month: d.active ? max_months : d.payoff_month,
    interest_paid: d.interest_paid,
  }));

  return {
    payoff_exceeds_horizon: months >= max_months,
    total_interest,
    months_to_payoff: months,
    debts: results,
    timeline,
  };
}
