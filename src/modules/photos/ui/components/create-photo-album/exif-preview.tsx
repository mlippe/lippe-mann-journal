import { BrandsLogo } from '@/components/brands-logo';
import { Separator } from '@/components/ui/separator';
import { formatExposureTime, TExifData } from '@/modules/photos/lib/utils';

export const ExifPreview = ({
  exif,
  showLogo = true,
}: {
  exif: TExifData | null;
  showLogo?: boolean;
}) => {
  console.log('exif', exif);

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
    <div className='flex flex-wrap gap-4'>
      <div>
        <h1 className='font-semibold text-sm  lg:text-lg'>
          <span className='flex items-center  gap-1'>
            {exif.make} {exif.model}
          </span>
        </h1>
        <p className='text-sm text-gray-800'>{exif.lensModel}</p>
      </div>
      <div className='flex items-center gap-4'>
        {showLogo && <BrandsLogo brand={exif.make || ''} />}

        <Separator orientation='vertical' className=' bg-gray-300' />
        <div className='flex flex-col gap-0.5'>
          <div className='space-x-1.5 text-sm lg:text-sm font-mono text-gray-800'>
            <span>{exif.focalLength35mm && exif.focalLength35mm + 'mm'}</span>
            <span>{exif.fNumber && 'ƒ/' + exif.fNumber}</span>
            <span>
              {exif.exposureTime && formatExposureTime(exif.exposureTime)}
            </span>
            <span>{exif.iso && 'ISO' + exif.iso}</span>
          </div>
          <div className='flex items-center text-xs text-gray-600'>
            <p>
              {exif.dateTimeOriginal &&
                new Date(exif.dateTimeOriginal).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
