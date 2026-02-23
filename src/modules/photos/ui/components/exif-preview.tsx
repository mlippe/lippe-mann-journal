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
          size === 'sm' && 'gap-1!',
        )}
      >
        <div
          className={clsx(size === 'sm' && 'flex gap-1 items-center flex-wrap')}
        >
          <p
            className={clsx(
              'font-semibold text-sm  lg:text-lg',
              size === 'sm' && 'text-sm! font-medium!',
            )}
          >
            <span className='flex items-center gap-1'>
              {exif.make} {exif.model}
            </span>
          </p>
          {size === 'sm' && <span className='text-gray-400'>·</span>}
          <p
            className={clsx(
              'text-sm text-gray-800',
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
          <div className='flex flex-col gap-0.5'>
            <div
              className={clsx(
                'space-x-2 text-sm font-mono text-gray-800',
                size === 'sm' && 'text-xs! flex-wrap flex',
              )}
            >
              <span>{exif.focalLength && exif.focalLength + 'mm'}</span>
              <span className='text-gray-400'>·</span>
              <span>{exif.fNumber && 'ƒ/' + exif.fNumber}</span>
              <span className='text-gray-400'>·</span>
              <span>
                {exif.exposureTime && formatExposureTime(exif.exposureTime)}
              </span>
              <span className='text-gray-400'>·</span>
              <span>{exif.iso && 'ISO' + exif.iso}</span>
            </div>
            <div className='flex items-center text-xs text-gray-500'>
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
