'use client';

import { useState } from 'react';
import UploadStep from './upload-step';
import ConfirmStep from './confirm-step';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@/trpc/client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { AlbumPhoto, ConfirmStepData } from './types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import BlurImage from '@/components/blur-image';
import { keyToUrl } from '@/modules/s3/lib/key-to-url';
import { Trash2 } from 'lucide-react';

const CreatePhotoAlbum = () => {
  const [photos, setPhotos] = useState<AlbumPhoto[]>([]);
  const [step, setStep] = useState<'upload' | 'confirm'>('upload');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const createAlbum = useMutation(trpc.photos.createAlbum.mutationOptions());

  const handlePhotoUploaded = (photo: AlbumPhoto) => {
    setPhotos((prev) => [...prev, photo]);
  };

  const removePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSubmit = (data: ConfirmStepData) => {
    setIsSubmitting(true);

    const finalPhotos = data.photos.map((p) => {
      // Remove temporary ID and map back to schema expected by createAlbum
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...rest } = p;
      return rest;
    });

    createAlbum.mutate(
      {
        postTitle: data.postTitle,
        postVisibility: data.postVisibility,
        photos: finalPhotos,
      },
      {
        onSuccess: async () => {
          await queryClient.invalidateQueries(
            trpc.photos.getMany.queryOptions({}),
          );
          toast.success('Album created successfully!');
          router.push(`/dashboard/new`);
        },
        onError: (error) => {
          toast.error(error.message);
          setIsSubmitting(false);
        },
      },
    );
  };

  return (
    <div className='mx-auto w-full max-w-4xl space-y-8'>
      {step === 'upload' && (
        <div className='space-y-6'>
          <UploadStep onPhotoUploaded={handlePhotoUploaded} />

          {photos.length > 0 && (
            <div className='space-y-4'>
              <h3 className='text-lg font-medium'>
                Uploaded Photos ({photos.length})
              </h3>
              <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
                {photos.map((photo) => (
                  <Card
                    key={photo.id}
                    className='relative overflow-hidden group'
                  >
                    <CardContent className='p-0 aspect-square relative'>
                      <BlurImage
                        blurhash={photo.blurData}
                        src={keyToUrl(photo.url)}
                        alt={photo.title}
                        fill
                        className='object-cover'
                        unoptimized
                      />
                      <div className='absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center'>
                        <Button
                          variant='destructive'
                          size='icon'
                          onClick={() => removePhoto(photo.id)}
                        >
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className='flex justify-end pt-4'>
                <Button onClick={() => setStep('confirm')} size='lg'>
                  Next: Album Details ({photos.length} photos)
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {step === 'confirm' && (
        <div className='space-y-6'>
          <div className='flex items-center justify-between'>
            <h2 className='text-2xl font-bold'>Album Configuration</h2>
            <Button variant='ghost' onClick={() => setStep('upload')}>
              ← Back to Upload
            </Button>
          </div>
          <ConfirmStep
            photos={photos}
            setPhotos={setPhotos}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
          />
        </div>
      )}
    </div>
  );
};

export default CreatePhotoAlbum;
