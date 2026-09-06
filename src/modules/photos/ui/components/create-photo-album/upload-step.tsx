'use client';

import { PhotoUploader } from '../photo-uploader';
import { DEFAULT_PHOTOS_UPLOAD_FOLDER } from '@/constants';
import { TExifData, TImageInfo } from '../../../lib/utils';
import { AlbumPhoto } from './types';
const UploadStep = ({
  onPhotoUploaded,
}: {
  onPhotoUploaded: (photo: AlbumPhoto) => void;
}) => {
  const handleUploadSuccess = (
    url: string,
    exif: TExifData | null,
    imageInfo: TImageInfo,
  ) => {
    const width =
      Number.isFinite(imageInfo.width) && imageInfo.width > 0
        ? imageInfo.width
        : 1;
    const height =
      Number.isFinite(imageInfo.height) && imageInfo.height > 0
        ? imageInfo.height
        : 1;
    const aspectRatio =
      Number.isFinite(imageInfo.aspectRatio) && imageInfo.aspectRatio > 0
        ? imageInfo.aspectRatio
        : Number((width / height).toFixed(2)) || 1;

    const newPhoto: AlbumPhoto = {
      id: crypto.randomUUID(),
      url,
      title: imageInfo.fileName?.trim() || 'Untitled.jpg',
      aspectRatio,
      width,
      height,
      blurData: imageInfo.blurhash || '',
      ...exif,
    };
    onPhotoUploaded(newPhoto);
  };

  return (
    <div className='space-y-6'>
      <div className='space-y-2'>
        <PhotoUploader
          folder={DEFAULT_PHOTOS_UPLOAD_FOLDER}
          onUploadSuccess={handleUploadSuccess}
          multiple={true}
        />
      </div>
    </div>
  );
};

export default UploadStep;
