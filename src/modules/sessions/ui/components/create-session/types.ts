export interface SessionPhotoDraft {
  id: string; // generated uuid
  file: File;
  previewUrl: string; // URL.createObjectURL
  uploadedUrl?: string; // S3/R2 key
  title: string;
  aspectRatio: number;
  width: number;
  height: number;
  blurData: string;
  frameNumber: number; // 1 to N
  isInitialPick: boolean;
  initialOrder: number | null;
  layoutPosition: 'left' | 'right' | 'solo';
  isHighlight: boolean;
  // EXIF
  make?: string | null;
  model?: string | null;
  lensModel?: string | null;
  focalLength?: number | null;
  focalLength35mm?: number | null;
  fNumber?: number | null;
  iso?: number | null;
  exposureTime?: number | null;
  exposureCompensation?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  dateTimeOriginal?: Date | null;
  // Upload status
  isUploaded: boolean;
  isUploading: boolean;
  uploadError?: string | null;
}

export type SessionWizardStep = 'upload' | 'grid' | 'pacing' | 'publish';
