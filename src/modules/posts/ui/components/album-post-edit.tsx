'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PostGetOne } from '../../types';
import { useTRPC } from '@/trpc/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import BlurImage from '@/components/blur-image';
import { keyToUrl } from '@/modules/s3/lib/key-to-url';
import { ExifPreview } from '@/modules/photos/ui/components/exif-preview';
import { TExifData } from '@/modules/photos/lib/utils';
import { ApertureSelector } from '@/modules/photos/ui/components/aperture-selector';
import { ShutterSpeedSelector } from '@/modules/photos/ui/components/shutter-speed-selector';
import { ISOSelector } from '@/modules/photos/ui/components/iso-selector';
import { ExposureCompensationSelector } from '@/modules/photos/ui/components/exposure-compensation-selector';
import { TagsInput } from '@/modules/articles/ui/components/tags-input';
import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { confirmStepSchema } from '@/modules/photos/ui/components/create-photo-album/types';

// Extend the creation schema with tags for the edit view
const formSchema = confirmStepSchema.extend({
  tags: z.array(z.string()),
});

type FormValues = z.infer<typeof formSchema>;

export const AlbumPostEdit = ({ post }: { post: PostGetOne }) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();

  const initialPhotos = (post.postsToPhotos || []).map((ptp) => ({
    id: ptp.photo.id,
    url: ptp.photo.url,
    blurData: ptp.photo.blurData,
    title: ptp.photo.title,
    aspectRatio: ptp.photo.aspectRatio,
    width: ptp.photo.width,
    height: ptp.photo.height,
    make: ptp.photo.make,
    model: ptp.photo.model,
    lensModel: ptp.photo.lensModel,
    focalLength: ptp.photo.focalLength,
    focalLength35mm: ptp.photo.focalLength35mm,
    fNumber: ptp.photo.fNumber,
    iso: ptp.photo.iso,
    exposureTime: ptp.photo.exposureTime,
    exposureCompensation: ptp.photo.exposureCompensation,
    latitude: ptp.photo.latitude,
    longitude: ptp.photo.longitude,
    gpsAltitude: ptp.photo.gpsAltitude,
    dateTimeOriginal: ptp.photo.dateTimeOriginal
      ? new Date(ptp.photo.dateTimeOriginal)
      : null,
  }));

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      postTitle: post.title,
      postVisibility: post.visibility,
      tags: post.tags || [],
      photos: initialPhotos,
    },
  });

  const { fields, move, remove } = useFieldArray({
    control: form.control,
    name: 'photos',
  });

  const updatePost = useMutation(
    trpc.posts.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.posts.getOne.queryOptions({ slug: post.slug }),
        );
      },
    }),
  );

  const updateAlbumPhotos = useMutation(
    trpc.posts.updateAlbumPhotos.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.posts.getOne.queryOptions({ slug: post.slug }),
        );
      },
    }),
  );

  const updatePhoto = useMutation(trpc.photos.update.mutationOptions());

  async function onSubmit(values: FormValues) {
    try {
      // 1. Update post basic info
      await updatePost.mutateAsync({
        id: post.id,
        title: values.postTitle,
        visibility: values.postVisibility,
        tags: values.tags,
      });

      // 2. Update post-to-photos relations (reordering/removal)
      await updateAlbumPhotos.mutateAsync({
        postId: post.id,
        photoIds: values.photos.map((p) => p.id),
      });

      // 3. Update each photo's metadata
      await Promise.all(
        values.photos.map((p) =>
          updatePhoto.mutateAsync({
            id: p.id,
            title: p.title,
            make: p.make,
            model: p.model,
            lensModel: p.lensModel,
            focalLength: p.focalLength,
            focalLength35mm: p.focalLength35mm,
            fNumber: p.fNumber,
            iso: p.iso,
            exposureTime: p.exposureTime,
            exposureCompensation: p.exposureCompensation,
            dateTimeOriginal: p.dateTimeOriginal || undefined,
            latitude: p.latitude,
            longitude: p.longitude,
            gpsAltitude: p.gpsAltitude,
          }),
        ),
      );

      toast.success('Album updated successfully');
      queryClient.invalidateQueries(
        trpc.posts.getOne.queryOptions({ slug: post.slug }),
      );
      router.push('/dashboard/posts');
    } catch (error) {
      toast.error(`Failed to update album: ${(error as Error).message}`);
    }
  }

  const isPending =
    updatePost.isPending ||
    updateAlbumPhotos.isPending ||
    updatePhoto.isPending;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className='space-y-8 max-w-5xl'
      >
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
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='flex items-center justify-between rounded-lg border p-4'>
              <div className='space-y-0.5'>
                <FormLabel>Visibility</FormLabel>
                <div className='text-sm text-muted-foreground'>
                  {form.watch('postVisibility') === 'public'
                    ? 'Public'
                    : 'Private'}
                </div>
              </div>
              <FormField
                control={form.control}
                name='postVisibility'
                render={({ field }) => (
                  <FormControl>
                    <Switch
                      checked={field.value === 'public'}
                      onCheckedChange={(checked) =>
                        field.onChange(checked ? 'public' : 'private')
                      }
                    />
                  </FormControl>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name='tags'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <TagsInput value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className='space-y-4'>
          <h3 className='text-xl font-semibold'>Photos</h3>
          {fields.map((field, index) => (
            <Card
              key={field.id}
              className={cn(
                'relative overflow-hidden',
                index === 0 && 'border-primary shadow-sm',
              )}
            >
              {index === 0 && (
                <div className='absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded-bl-md uppercase font-bold z-10'>
                  Cover Photo
                </div>
              )}
              <CardContent className='p-4'>
                <div className='flex gap-4 items-start md:flex-row flex-col'>
                  <div className='flex gap-4 items-center'>
                    <div className='flex flex-col gap-2'>
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon'
                        disabled={index === 0}
                        onClick={() => move(index, index - 1)}
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
                        onClick={() => move(index, index + 1)}
                      >
                        <ArrowDown className='h-4 w-4' />
                      </Button>
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon'
                        className='text-destructive'
                        onClick={() => remove(index)}
                      >
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </div>

                    <div className='relative h-32 w-48 shrink-0 overflow-hidden rounded-md border bg-muted'>
                      <BlurImage
                        blurhash={field.blurData}
                        src={keyToUrl(field.url)}
                        alt={field.title}
                        fill
                        className='object-contain'
                        unoptimized
                      />
                    </div>
                  </div>

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

                    <div className='flex items-center gap-4'>
                      <div className='flex-1'>
                        <ExifPreview
                          exif={
                            form.getValues(
                              `photos.${index}`,
                            ) as unknown as TExifData
                          }
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
                              value={field.value || ''}
                              placeholder='e.g., Canon'
                            />
                          </FormControl>
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
                              value={field.value || ''}
                              placeholder='e.g., EOS R5'
                            />
                          </FormControl>
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
                              value={field.value || ''}
                              placeholder='e.g., RF 24-70mm'
                            />
                          </FormControl>
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
                              value={
                                field.value
                                  ? new Date(field.value)
                                      .toISOString()
                                      .slice(0, 16)
                                  : ''
                              }
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value
                                    ? new Date(e.target.value)
                                    : null,
                                )
                              }
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className='flex justify-end gap-4'>
          <Button type='button' variant='ghost' onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type='submit' disabled={isPending}>
            {isPending ? 'Updating Album...' : 'Update Album'}
          </Button>
        </div>
      </form>
    </Form>
  );
};
