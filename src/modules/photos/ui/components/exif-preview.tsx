import { BrandsLogo } from '@/components/brands-logo';
import { Separator } from '@/components/ui/separator';
import { formatExposureTime, TExifData } from '@/modules/photos/lib/utils';
import clsx from 'clsx';
import { format } from 'date-fns';

export const ExifPreview = ({
  exif,
  showLogo = true,
  size = 'md',
}: {
  exif: TExifData | null;
  showLogo?: boolean;
  size?: 'sm' | 'md';
}) => {
  const hasAnyExifValue =
    exif &&
    Object.values(exif).some((value) => value !== undefined && value !== null);

  console.log(exif, hasAnyExifValue);

  if (!hasAnyExifValue || !exif) {
    return (
      <p className='text-xs text-muted-foreground mt-1'>
        No EXIF data found. Please fill in manually.
      </p>
    );
  }

  return (
    <div className='@container'>
      <div
        className={clsx(
          'flex flex-col gap-2 @sm:gap-4 @sm:flex-row',
          size === 'sm' && 'gap-y-1! gap-x-4',
        )}
      >
        <div
          className={clsx(
            size === 'sm' && 'flex gap-x-1 gap-y-0 items-center flex-wrap',
          )}
        >
          <p
            className={clsx(
              'font-semibold text-sm  lg:text-lg text-foreground',
              size === 'sm' && 'text-sm! font-medium!',
            )}
          >
            <span className='flex items-center gap-1'>
              {exif.make} {exif.model}
            </span>
          </p>
          {size === 'sm' && <span className='text-foreground/40'>·</span>}
          <p
            className={clsx(
              'text-sm text-foreground/80',
              size === 'sm' && 'text-xs!',
            )}
          >
            {exif.lensModel}
          </p>
        </div>
        <div className='flex flex-col @sm:flex-row @sm:items-center gap-2 @sm:gap-4'>
          {showLogo && <BrandsLogo brand={exif.make || ''} />}

          {size !== 'sm' && (
            <>
              <Separator
                orientation='horizontal'
                className=' bg-gray-200 @sm:hidden'
              />
              <Separator
                orientation='vertical'
                className=' bg-gray-200 @sm:block hidden'
              />
            </>
          )}
          <div className='flex flex-wrap gap-y-0.5 gap-x-2'>
            <div
              className={clsx(
                'space-x-2 text-sm font-mono text-foreground',
                size === 'sm' && 'text-xs! flex-wrap flex gap-x-1 space-x-0!',
              )}
            >
              <span>{exif.focalLength && exif.focalLength + 'mm'}</span>
              <span className='text-foreground/40'>·</span>
              <span>{exif.fNumber && 'ƒ/' + exif.fNumber}</span>
              <span className='text-foreground/40'>·</span>
              <span>
                {exif.exposureTime && formatExposureTime(exif.exposureTime)}
              </span>
              <span className='text-foreground/40'>·</span>
              <span>{exif.iso && 'ISO' + exif.iso}</span>
            </div>
            <div className='flex items-center text-xs text-foreground/60'>
              <p>
                {exif.dateTimeOriginal &&
                  format(exif.dateTimeOriginal, 'dd.MM.yyyy')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
