import { z } from 'zod';

// ============================================================================
// FORM SCHEMAS
// ============================================================================

export const uploadStepSchema = z.object({
  url: z
    .string()
    .min(1, { message: 'Please upload a photo before proceeding' }),
});

export type UploadStepData = z.infer<typeof uploadStepSchema>;

export const confirmStepSchema = z.object({
  postVisibility: z.enum(['private', 'public']).default('private'),
  postTitle: z.string().min(1, { message: 'Title is required' }),

  title: z.string().min(1, { message: 'Title is required' }),

  latitude: z.number().optional(),
  longitude: z.number().optional(),
  gpsAltitude: z.number().optional(),
  dateTimeOriginal: z.date().optional(),
  make: z.string().optional(),
  model: z.string().optional(),
  lensModel: z.string().optional(),
  focalLength: z.number().optional(),
  focalLength35mm: z.number().optional(),
  fNumber: z.number().optional(),
  iso: z.number().optional(),
  exposureTime: z.number().optional(),
  exposureCompensation: z.number().optional(),
});

export type ConfirmStepData = z.infer<typeof confirmStepSchema>;
