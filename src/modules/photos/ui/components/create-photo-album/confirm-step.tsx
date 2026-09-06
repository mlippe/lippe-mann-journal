'use client';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useForm, useFieldArray, FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dispatch, SetStateAction, useState } from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ISOSelector } from '../iso-selector';
import { ShutterSpeedSelector } from '../shutter-speed-selector';
import { ExposureCompensationSelector } from '../exposure-compensation-selector';
import { ApertureSelector } from '../aperture-selector';
import BlurImage from '@/components/blur-image';
import { keyToUrl } from '@/modules/s3/lib/key-to-url';
import { Button } from '@/components/ui/button';
import { ExifPreview } from '../exif-preview';
import { ConfirmStepData, confirmStepSchema, AlbumPhoto } from './types';
import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react';
import { CollectionSelect } from '@/modules/posts/ui/components/collection-select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  fromDatetimeLocalString,
  TExifData,
  toDatetimeLocalString,
} from '@/modules/photos/lib/utils';

const ConfirmStep = ({
  photos: initialPhotos,
  setPhotos,
  isSubmitting,
  onSubmit,
}: {
  photos: AlbumPhoto[];
  setPhotos: Dispatch<SetStateAction<AlbumPhoto[]>>;
  isSubmitting: boolean;
  onSubmit: (data: ConfirmStepData) => void;
}) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const sanitizedInitialPhotos: AlbumPhoto[] = initialPhotos.map((photo) => ({
    ...photo,
    title: photo.title?.trim() || 'Untitled.jpg',
    aspectRatio:
      typeof photo.aspectRatio === 'number' &&
      Number.isFinite(photo.aspectRatio) &&
      photo.aspectRatio > 0
        ? photo.aspectRatio
        : 1,
    width:
      typeof photo.width === 'number' &&
      Number.isFinite(photo.width) &&
      photo.width > 0
        ? photo.width
        : 1,
    height:
      typeof photo.height === 'number' &&
      Number.isFinite(photo.height) &&
      photo.height > 0
        ? photo.height
        : 1,
    blurData: photo.blurData || '',
    make: typeof photo.make === 'string' && photo.make.trim() ? photo.make.trim() : null,
    model: typeof photo.model === 'string' && photo.model.trim() ? photo.model.trim() : null,
    lensModel:
      typeof photo.lensModel === 'string' && photo.lensModel.trim()
        ? photo.lensModel.trim()
        : null,
    focalLength:
      typeof photo.focalLength === 'number' && Number.isFinite(photo.focalLength)
        ? photo.focalLength
        : null,
    focalLength35mm:
      typeof photo.focalLength35mm === 'number' &&
      Number.isFinite(photo.focalLength35mm)
        ? photo.focalLength35mm
        : null,
    fNumber:
      typeof photo.fNumber === 'number' && Number.isFinite(photo.fNumber)
        ? photo.fNumber
        : null,
    iso:
      typeof photo.iso === 'number' && Number.isFinite(photo.iso)
        ? photo.iso
        : null,
    exposureTime:
      typeof photo.exposureTime === 'number' &&
      Number.isFinite(photo.exposureTime)
        ? photo.exposureTime
        : null,
    exposureCompensation:
      typeof photo.exposureCompensation === 'number' &&
      Number.isFinite(photo.exposureCompensation)
        ? photo.exposureCompensation
        : null,
    latitude:
      typeof photo.latitude === 'number' && Number.isFinite(photo.latitude)
        ? photo.latitude
        : null,
    longitude:
      typeof photo.longitude === 'number' && Number.isFinite(photo.longitude)
        ? photo.longitude
        : null,
    gpsAltitude:
      typeof photo.gpsAltitude === 'number' && Number.isFinite(photo.gpsAltitude)
        ? photo.gpsAltitude
        : null,
    dateTimeOriginal:
      photo.dateTimeOriginal instanceof Date &&
      !isNaN(photo.dateTimeOriginal.getTime())
        ? photo.dateTimeOriginal
        : null,
  }));

  const form = useForm<ConfirmStepData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(confirmStepSchema) as any,
    defaultValues: {
      postTitle: '',
      postVisibility: 'public',
      collectionIds: [],
      photos: sanitizedInitialPhotos,
    },
    mode: 'onChange',
  });

  const { control, handleSubmit } = form;
  const { fields, move, remove } = useFieldArray({
    control,
    name: 'photos',
  });

  const onInvalid = (errors: FieldErrors<ConfirmStepData>) => {
    console.error('Album creation validation errors:', errors);

    if (errors.postTitle) {
      toast.error(errors.postTitle.message || 'Please enter an album title.');
      return;
    }

    if (errors.photos) {
      if (typeof errors.photos.message === 'string') {
        toast.error(errors.photos.message);
        return;
      }

      if (Array.isArray(errors.photos)) {
        const errorIndex = errors.photos.findIndex((p) => p !== undefined);
        if (errorIndex !== -1) {
          setExpandedIndex(errorIndex);
          const photoError = errors.photos[errorIndex];
          const firstField = photoError
            ? Object.values(photoError)[0]
            : null;
          const msg =
            firstField &&
            typeof firstField === 'object' &&
            'message' in firstField
              ? String(firstField.message)
              : 'Please check the photo details.';
          toast.error(`Photo ${errorIndex + 1}: ${msg}`);
          return;
        }
      }
    }

    toast.error('Please check the form for errors before creating the album.');
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className='space-y-8'>
        {/* Album Global Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Album Settings</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <FormField
              control={form.control}
              name='postTitle'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Album Title</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder='Enter album title' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='collectionIds'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Collections</FormLabel>
                  <FormControl>
                    <CollectionSelect
                      value={field.value || []}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='postVisibility'
              render={({ field }) => (
                <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                  <div className='space-y-0.5'>
                    <FormLabel className='text-base'>
                      Visibility:{' '}
                      {field.value === 'public' ? 'Public' : 'Private'}
                    </FormLabel>
                    <div className='text-sm text-muted-foreground'>
                      {field.value === 'public'
                        ? 'Anyone can view this album.'
                        : 'Only you can view this album.'}
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value === 'public'}
                      onCheckedChange={(checked) =>
                        field.onChange(checked ? 'public' : 'private')
                      }
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Photos List */}
        <div className='space-y-4'>
          <h3 className='text-xl font-semibold'>Photos</h3>
          {fields.map((field, index) => (
            <Card
              key={field.id}
              className={cn(
                'relative overflow-hidden transition-all',
                index === 0 && 'border-primary shadow-sm',
              )}
            >
              {index === 0 && (
                <div className='absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded-bl-md uppercase font-bold z-10'>
                  Cover Photo
                </div>
              )}
              <CardContent className='px-4'>
                <div className='flex gap-4 items-start lg:flex-row flex-col'>
                  {/* Sorting & Basic Controls */}
                  <div className='flex gap-4 items-center'>
                    <div className='flex flex-col gap-2 '>
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon'
                        disabled={index === 0}
                        onClick={() => {
                          move(index, index - 1);
                          setPhotos((prev) => {
                            const updated = [...prev];
                            const [moved] = updated.splice(index, 1);
                            updated.splice(index - 1, 0, moved);
                            return updated;
                          });
                        }}
                      >
                        <ArrowUp className='h-4 w-4' />
                      </Button>
                      <div className='text-center text-xs font-mono font-bold text-muted-foreground'>
                        {index + 1}
                      </div>
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon'
                        disabled={index === fields.length - 1}
                        onClick={() => {
                          move(index, index + 1);
                          setPhotos((prev) => {
                            const updated = [...prev];
                            const [moved] = updated.splice(index, 1);
                            updated.splice(index + 1, 0, moved);
                            return updated;
                          });
                        }}
                      >
                        <ArrowDown className='h-4 w-4' />
                      </Button>
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon'
                        className='text-destructive'
                        onClick={() => {
                          remove(index);
                          setPhotos((prev) =>
                            prev.filter((_, i) => i !== index),
                          );
                        }}
                      >
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </div>

                    {/* Photo Preview */}
                    <div className='relative min-h-32 min-w-48 w-full md:w-fit shrink-0 overflow-hidden rounded-md border bg-muted'>
                      <BlurImage
                        blurhash={field.blurData}
                        src={keyToUrl(field.url)}
                        alt={`Photo ${index + 1}`}
                        fill
                        className='object-contain'
                        unoptimized
                      />
                    </div>
                  </div>

                  {/* Photo Details */}
                  <div className='flex-1 space-y-4 w-full'>
                    <FormField
                      control={form.control}
                      name={`photos.${index}.title`}
                      render={({ field: inputField }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              {...inputField}
                              placeholder='Photo title'
                              className='font-semibold text-lg border-transparent hover:border-input focus:border-input px-1'
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className='flex items-center gap-4 '>
                      <div className='flex-1'>
                        <ExifPreview
                          exif={form.getValues(`photos.${index}`) as TExifData}
                          showLogo={false}
                        />
                      </div>
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={() =>
                          setExpandedIndex(
                            expandedIndex === index ? null : index,
                          )
                        }
                      >
                        {expandedIndex === index ? 'Hide EXIF' : 'Edit EXIF'}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Expanded EXIF Editing */}
                {expandedIndex === index && (
                  <div className='mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 border-t pt-6 animate-in slide-in-from-top-2 duration-200'>
                    <FormField
                      control={form.control}
                      name={`photos.${index}.make`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Camera Make</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value ?? ''}
                              placeholder='e.g., Canon'
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`photos.${index}.model`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Camera Model</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value ?? ''}
                              placeholder='e.g., EOS R5'
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`photos.${index}.lensModel`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lens Model</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value ?? ''}
                              placeholder='e.g., RF 24-70mm f/2.8L'
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`photos.${index}.focalLength`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Focal Length (mm)</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type='number'
                              value={field.value ?? ''}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value
                                    ? parseFloat(e.target.value)
                                    : null,
                                )
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`photos.${index}.fNumber`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Aperture</FormLabel>
                          <FormControl>
                            <ApertureSelector
                              value={field.value ?? undefined}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`photos.${index}.exposureTime`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Shutter Speed</FormLabel>
                          <FormControl>
                            <ShutterSpeedSelector
                              value={field.value ?? undefined}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`photos.${index}.iso`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ISO</FormLabel>
                          <FormControl>
                            <ISOSelector
                              value={field.value ?? undefined}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`photos.${index}.exposureCompensation`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Exposure Comp.</FormLabel>
                          <FormControl>
                            <ExposureCompensationSelector
                              value={field.value ?? undefined}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`photos.${index}.dateTimeOriginal`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date Taken</FormLabel>
                          <FormControl>
                            <Input
                              type='datetime-local'
                              value={toDatetimeLocalString(field.value)}
                              onChange={(e) =>
                                field.onChange(
                                  fromDatetimeLocalString(e.target.value),
                                )
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className='sticky bottom-2 z-20 flex justify-end gap-4 p-4 bg-background/80 backdrop-blur-sm border rounded-lg shadow-lg'>
          <Button
            type='submit'
            size='lg'
            disabled={isSubmitting || fields.length === 0}
          >
            {isSubmitting ? 'Creating Album...' : 'Create Album'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ConfirmStep;
