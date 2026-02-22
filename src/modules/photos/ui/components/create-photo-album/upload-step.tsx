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
    const newPhoto: AlbumPhoto = {
      id: crypto.randomUUID(),
      url,
      title: imageInfo.fileName || 'Untitled.jpg',
      aspectRatio: imageInfo.width / imageInfo.height,
      width: imageInfo.width,
      height: imageInfo.height,
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
