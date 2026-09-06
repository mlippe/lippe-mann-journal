import { ExifParserFactory } from 'ts-exif-parser';
import { encode } from 'blurhash';
import { format, type Locale } from 'date-fns';
import { de } from 'date-fns/locale';

/**
 * Format exposure time to string (e.g., "1/1000")
 * @example formatExposureTime(1) => "1/1000"
 */
export const formatExposureTime = (exposureTime?: number): string => {
  if (!exposureTime) return '';
  return exposureTime < 1
    ? `1/${Math.round(1 / exposureTime)}`
    : exposureTime.toString();
};

/**
 * Format exposure compensation to string (e.g., "+1 EV", "0 EV", or "-1 EV")
 * @example formatExposureCompensation(1) => "+1 EV"
 */
export const formatExposureCompensation = (
  exposureCompensation?: number,
): string => {
  if (typeof exposureCompensation !== 'number') return '';
  if (exposureCompensation === 0) return '0 EV';
  return `${exposureCompensation > 0 ? '+' : ''}${exposureCompensation} EV`;
};

/**
 * Format focal length with unit
 * @example formatFocalLength(50) => "50mm"
 */
export const formatFocalLength = (focalLength?: number | null): string => {
  if (!focalLength) return '';
  return `${focalLength}mm`;
};

/**
 * Format focal length 35mm equivalent
 * @example formatFocalLength35mm(50) => "50mm in 35mm"
 */
export const formatFocalLength35mm = (
  focalLength35mm?: number | null,
): string => {
  if (!focalLength35mm) return '';
  return `${focalLength35mm}mm in 35mm`;
};

/**
 * Format f-number with f/ prefix
 * @example formatFNumber(1.8) => "f/1.8"
 * @example formatFNumber(2.0) => "f/2"
 */
export const formatFNumber = (fNumber?: number): string => {
  if (!fNumber) return '';

  if (Number.isInteger(fNumber) || fNumber % 1 === 0) {
    return `f/${Math.round(fNumber)}`;
  }

  return `f/${fNumber.toFixed(1)}`;
};

/**
 * Format ISO with prefix
 * @example formatISO(100) => "ISO 100"
 */
export const formatISO = (iso?: number): string => {
  if (!iso) return '';
  return `ISO ${iso}`;
};

/**
 * Format GPS coordinates to decimal degrees
 * @example formatGPSCoordinates(40.7128, -74.006) => "40.7128°N, 74.006°W"
 */
export const formatGPSCoordinates = (
  latitude?: number | null,
  longitude?: number | null,
): string => {
  if (!longitude || !latitude) return '- -';

  const eastWest = longitude >= 0 ? 'E' : 'W';
  const northSouth = latitude >= 0 ? 'N' : 'S';

  const eastWestCoord = `${Math.abs(longitude).toFixed(4)} ${eastWest}`;
  const northSouthCoord = `${Math.abs(latitude).toFixed(4)} ${northSouth}`;

  return `${eastWestCoord}, ${northSouthCoord}`;
};

/**
 * Format GPS altitude
 * @example formatGPSAltitude(100.5) => "100.5m"
 */
export const formatGPSAltitude = (altitude?: number) => {
  if (!altitude) return '';
  return `${altitude.toFixed(1)}m`;
};

/**
 * Format date time with detailed format
 * The camera has timezone settings, directly convert timestamp to date
 * The time defaults to the timezone set by the camera
 * @param date Date object
 * @returns Formatted date time string
 * @example formatDateTime(new Date()) => "2024-01-01 12:00:00"
 */
export const formatDateTime = (date?: Date) => {
  if (!date) return '';

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

/**
 * Format snake case string to title case
 * @example snakeCaseToTitle("hello_world") => "Hello World"
 */
export function snakeCaseToTitle(str: string) {
  return str.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

export interface TExifData {
  /** Camera manufacturer */
  make?: string;
  /** Camera model */
  model?: string;
  /** Lens model */
  lensModel?: string;
  /** Focal length in millimeters */
  focalLength?: number;
  /** 35mm equivalent focal length */
  focalLength35mm?: number;
  /** F-number (aperture) */
  fNumber?: number;
  /** ISO speed */
  iso?: number;
  /** Exposure time in seconds */
  exposureTime?: number;
  /** Exposure compensation value in EV */
  exposureCompensation?: number;
  /** GPS latitude in decimal degrees */
  latitude?: number;
  /** GPS longitude in decimal degrees */
  longitude?: number;
  /** GPS altitude in meters */
  gpsAltitude?: number;
  /** Original date and time when the photo was taken */
  dateTimeOriginal?: Date;
}

export interface TImageInfo {
  /** Image width in pixels */
  width: number;
  /** Image height in pixels */
  height: number;
  /** Aspect ratio (width/height) */
  aspectRatio: number;
  /** BlurHash representation of the image */
  blurhash: string;
  /** Original image file name */
  fileName?: string;
  /** Image MIME type */
  mimeType?: string;
  /** Image file size in bytes */
  fileSize?: number;
}

const loadImage = async (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Format EXIF date without timezone shifts.
 * EXIF dates are usually stored as local time without timezone info.
 * This function treats the date as UTC and formats it to show the "Camera Time".
 */
export const formatExifDate = (
  date: Date | string | number | undefined | null,
  formatStr: string = 'dd.MM.yyyy, p',
  options?: { locale?: Locale },
): string => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  // Create a new Date object using UTC components as local components
  // This effectively shows the date "as is" without timezone conversion
  const utcDate = new Date(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate(),
    d.getUTCHours(),
    d.getUTCMinutes(),
    d.getUTCSeconds(),
  );

  return format(utcDate, formatStr, { locale: options?.locale ?? de });
};

/**
 * Convert a date to a string suitable for datetime-local input, using UTC components.
 */
export const toDatetimeLocalString = (
  date: Date | string | number | undefined | null,
): string => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  const hours = String(d.getUTCHours()).padStart(2, '0');
  const minutes = String(d.getUTCMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * Convert a datetime-local input string to a Date object, treating components as UTC.
 */
export const fromDatetimeLocalString = (value: string): Date | null => {
  if (!value) return null;
  const [datePart, timePart] = value.split('T');
  if (!datePart || !timePart) return null;
  const dateParts = datePart.split('-').map(Number);
  const timeParts = timePart.split(':').map(Number);

  if (dateParts.length !== 3 || timeParts.length < 2) return null;

  const d = new Date(
    Date.UTC(
      dateParts[0],
      dateParts[1] - 1,
      dateParts[2],
      timeParts[0],
      timeParts[1],
    ),
  );
  return isNaN(d.getTime()) ? null : d;
};

export function parseExifDate(val: unknown): Date | undefined {
  if (!val) return undefined;
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? undefined : val;
  }
  if (typeof val === 'number') {
    if (!Number.isFinite(val)) return undefined;
    const d = new Date(val * (val < 1e11 ? 1000 : 1));
    return isNaN(d.getTime()) ? undefined : d;
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return undefined;
    const normalized = trimmed.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3');
    const d = new Date(normalized);
    return isNaN(d.getTime()) ? undefined : d;
  }
  return undefined;
}

export function parseExifNumber(val: unknown): number | undefined {
  if (typeof val === 'number' && Number.isFinite(val)) {
    return val;
  }
  if (typeof val === 'string' && val.trim() !== '') {
    const num = Number(val);
    if (Number.isFinite(num)) return num;
  }
  return undefined;
}

export function parseExifString(val: unknown): string | undefined {
  if (typeof val === 'string') {
    const trimmed = val.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  return undefined;
}

/**
 * Extract EXIF data from photo file
 * @param file Photo file
 * @returns EXIF data.(make, model, etc.)
 */
export const getPhotoExif = async (file: File): Promise<TExifData | null> => {
  try {
    const buffer = await file.arrayBuffer();
    const parser = ExifParserFactory.create(Buffer.from(buffer));
    const result = parser.parse();

    if (!result || !result.tags) {
      return null;
    }

    const {
      Make,
      Model,
      LensModel,
      FocalLength,
      FocalLengthIn35mmFormat,
      FNumber,
      ISO,
      ExposureTime,
      ExposureCompensation,
      GPSLatitude,
      GPSLongitude,
      GPSAltitude,
      DateTimeOriginal,
    } = result.tags;

    // Type cast and validation
    const exifData: TExifData = {
      make: parseExifString(Make),
      model: parseExifString(Model),
      lensModel: parseExifString(LensModel),
      focalLength: parseExifNumber(FocalLength),
      focalLength35mm: parseExifNumber(FocalLengthIn35mmFormat),
      fNumber: parseExifNumber(FNumber),
      iso: parseExifNumber(ISO),
      exposureTime: parseExifNumber(ExposureTime),
      exposureCompensation: parseExifNumber(ExposureCompensation),
      latitude: parseExifNumber(GPSLatitude),
      longitude: parseExifNumber(GPSLongitude),
      gpsAltitude: parseExifNumber(GPSAltitude),
      dateTimeOriginal: parseExifDate(DateTimeOriginal),
    };

    return exifData;
  } catch (error) {
    console.error('Error reading EXIF data:', error);
    return null;
  }
};

/**
 * Extract image metadata and blurhash from photo file
 * @param file Photo file
 * @returns Image width, height, aspect ratio, blurhash
 */
export const getImageInfo = async (file: File): Promise<TImageInfo> => {
  if (!file) {
    throw new Error('No file provided');
  }

  if (!file.type.startsWith('image/')) {
    throw new Error('Invalid file type. Only images are allowed');
  }

  try {
    const img = await loadImage(file);
    // generate blurhash
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    ctx.drawImage(img, 0, 0, 32, 32);
    const imageData = ctx.getImageData(0, 0, 32, 32);

    const blurhash = encode(
      imageData.data,
      imageData.width,
      imageData.height,
      5,
      4,
    );

    if (!blurhash) {
      throw new Error('Failed to generate blurhash');
    }

    const width = Number.isFinite(img.width) && img.width > 0 ? img.width : 1;
    const height = Number.isFinite(img.height) && img.height > 0 ? img.height : 1;
    const calculatedAspect = Number((width / height).toFixed(2));
    const aspectRatio = Number.isFinite(calculatedAspect) && calculatedAspect > 0 ? calculatedAspect : 1;

    const imageInfo: TImageInfo = {
      width,
      height,
      aspectRatio,
      blurhash,
      fileName: file.name?.trim() || undefined,
      mimeType: file.type,
      fileSize: file.size,
    };

    // cleanup
    URL.revokeObjectURL(img.src);

    return imageInfo;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to process image: ' + String(error));
  }
};
