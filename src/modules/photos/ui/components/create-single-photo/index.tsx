'use client';

import { useEffect, useState } from 'react';
import { TExifData, TImageInfo } from '../../../lib/utils';
import UploadStep from './upload-step';
import ConfirmStep from './confirm-step';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@/trpc/client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { ConfirmStepData } from './types';

const CreateSinglePhoto = () => {
  const [url, setUrl] = useState<string | null>(null);
  const [exif, setExif] = useState<TExifData | null>(null);
  const [imageInfo, setImageInfo] = useState<TImageInfo>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const createPhoto = useMutation(trpc.photos.create.mutationOptions());

  const createImage = (data: ConfirmStepData) => {
    const finalData = {
      ...data,
      ...exif,
      url: url || '',
      title: data.title || '',
      aspectRatio: imageInfo ? imageInfo.width / imageInfo.height : 1,
      width: imageInfo?.width || 0,
      height: imageInfo?.height || 0,
      blurData: imageInfo?.blurhash || '',
    };

    setIsSubmitting(true);

    createPhoto.mutate(finalData, {
      onSuccess: async (data) => {
        // Invalidate queries to refetch photos list
        await queryClient.invalidateQueries(
          trpc.photos.getMany.queryOptions({}),
        );
        // await queryClient.invalidateQueries(
        //   trpc.home.getManyLikePhotos.queryOptions({ limit: 10 }),
        // );
        // await queryClient.invalidateQueries(
        //   trpc.home.getCitySets.queryOptions({ limit: 9 }),
        // );
        // await queryClient.invalidateQueries(trpc.city.getMany.queryOptions());

        toast.success('Photo uploaded successfully!');
        router.push(`/dashboard/new`);
        setIsSubmitting(false);
      },
      onError: (error) => {
        toast.error(error.message);
        setIsSubmitting(false);
      },
    });
  };

  return (
    <div className='mx-auto w-full'>
      {!url && !imageInfo && (
        <UploadStep
          setUrl={setUrl}
          setExif={setExif}
          setImageInfo={setImageInfo}
        />
      )}
      {url && imageInfo && (
        <ConfirmStep
          url={url}
          exif={exif}
          imageInfo={imageInfo}
          isSubmitting={isSubmitting}
          setExif={setExif}
          createImage={createImage}
        />
      )}
    </div>
  );
};

export default CreateSinglePhoto;
