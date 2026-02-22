import { z } from 'zod';

// ============================================================================
// FORM SCHEMAS
// ============================================================================

export const uploadStepSchema = z.object({
  urls: z
    .array(z.string())
    .min(1, { message: 'Please upload at least one photo before proceeding' }),
});

export type UploadStepData = z.infer<typeof uploadStepSchema>;

export const albumPhotoSchema = z.object({
  id: z.string(),
  url: z.string(),
  title: z.string().min(1, { message: 'Title is required' }),
  aspectRatio: z.number(),
  width: z.number(),
  height: z.number(),
  blurData: z.string(),

  // EXIF Data
  make: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  lensModel: z.string().optional().nullable(),
  focalLength: z.number().optional().nullable(),
  focalLength35mm: z.number().optional().nullable(),
  fNumber: z.number().optional().nullable(),
  iso: z.number().optional().nullable(),
  exposureTime: z.number().optional().nullable(),
  exposureCompensation: z.number().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  gpsAltitude: z.number().optional().nullable(),
  dateTimeOriginal: z.date().optional().nullable(),
});

export type AlbumPhoto = z.infer<typeof albumPhotoSchema>;

export const confirmStepSchema = z.object({
  postVisibility: z.enum(['private', 'public']),
  postTitle: z.string().min(1, { message: 'Album title is required' }),
  photos: z.array(albumPhotoSchema).min(1, { message: 'At least one photo is required' }),
});

export type ConfirmStepData = z.infer<typeof confirmStepSchema>;
