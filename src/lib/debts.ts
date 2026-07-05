import { z } from 'zod';

export const createDebtSchema = z.object({
  name: z.string().min(1).max(100),
  principal: z.number().positive(),
  apr: z.number().min(0).max(100),
  minimum_payment: z.number().positive(),
  type: z.enum(['credit_card', 'personal_loan', 'bnpl', 'other']),
});

export const updateDebtSchema = createDebtSchema.partial();
