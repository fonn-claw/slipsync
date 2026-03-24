import { z } from 'zod';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const createBookingSchema = z
  .object({
    slipId: z.number().int().positive(),
    vesselId: z.number().int().positive(),
    boaterId: z.number().int().positive(),
    type: z.enum(['transient', 'seasonal']),
    startDate: z.string().regex(dateRegex, 'Date must be YYYY-MM-DD format'),
    endDate: z.string().regex(dateRegex, 'Date must be YYYY-MM-DD format'),
    notes: z.string().optional(),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: 'End date must be after start date',
    path: ['endDate'],
  });

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
