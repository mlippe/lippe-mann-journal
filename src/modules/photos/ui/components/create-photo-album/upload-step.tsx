'use client';

import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PhotoUploader } from '../photo-uploader';
import { DEFAULT_PHOTOS_UPLOAD_FOLDER } from '@/constants';

import { TExifData, TImageInfo } from '../../../lib/utils';
import { uploadStepSchema, UploadStepData } from './types';
import { Dispatch, SetStateAction } from 'react';

const UploadStep = ({
  setUrl,
  setExif,
  setImageInfo,
}: {
  setUrl: Dispatch<SetStateAction<string | null>>;
  setExif: Dispatch<SetStateAction<TExifData | null>>;
  setImageInfo: Dispatch<SetStateAction<TImageInfo | undefined>>;
}) => {
  const form = useForm<UploadStepData>({
    resolver: zodResolver(uploadStepSchema),
    defaultValues: {
      url: '',
    },
    mode: 'onChange',
  });
  const { handleSubmit } = form;

  const onSubmit = (data: UploadStepData) => {
    console.log(data);
  };

  return (
    <div className='space-y-6'>
      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
          <div className='space-y-2'>
            <PhotoUploader
              folder={DEFAULT_PHOTOS_UPLOAD_FOLDER}
              onUploadSuccess={(url, exif, imageInfo) => {
                setUrl(url);
                setExif(exif);
                setImageInfo(imageInfo);

                form.setValue('url', url, { shouldValidate: true });
              }}
            />
            <FormField
              control={form.control}
              name='url'
              render={({ fieldState }) => (
                <FormItem>{fieldState.error && <FormMessage />}</FormItem>
              )}
            />
          </div>
        </form>
      </Form>
    </div>
  );
};

export default UploadStep;
