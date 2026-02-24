'use client';

import { useForm } from 'react-hook-form';
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
import { confirmStepSchema } from '@/modules/photos/ui/components/create-single-photo/types';

// Extend the creation schema with tags for the edit view
const formSchema = confirmStepSchema.extend({
  postVisibility: z.enum(['private', 'public']),
  tags: z.array(z.string()),
});

type FormValues = z.infer<typeof formSchema>;

export const PhotoPostEdit = ({ post }: { post: PostGetOne }) => {
  const [isEditExif, setIsEditExif] = useState(false);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();

  const photo = post.postsToPhotos?.[0]?.photo;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      postTitle: post.title,
      postVisibility: post.visibility,
      tags: post.tags || [],
      title: photo?.title || '',
      make: photo?.make || undefined,
      model: photo?.model || undefined,
      lensModel: photo?.lensModel || undefined,
      focalLength: photo?.focalLength || undefined,
      focalLength35mm: photo?.focalLength35mm || undefined,
      fNumber: photo?.fNumber || undefined,
      iso: photo?.iso || undefined,
      exposureTime: photo?.exposureTime || undefined,
      exposureCompensation: photo?.exposureCompensation || undefined,
      dateTimeOriginal: photo?.dateTimeOriginal
        ? new Date(photo.dateTimeOriginal)
        : undefined,
      latitude: photo?.latitude ?? undefined,
      longitude: photo?.longitude ?? undefined,
      gpsAltitude: photo?.gpsAltitude ?? undefined,
    },
  });

  const updatePost = useMutation(
    trpc.posts.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.posts.getOne.queryOptions({ slug: post.slug }),
        );
        toast.success('Post updated');
      },
      onError: (e) => toast.error(`Failed to update post: ${e.message}`),
    }),
  );

  const updatePhoto = useMutation(
    trpc.photos.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.posts.getOne.queryOptions({ slug: post.slug }),
        );
        toast.success('Photo metadata updated');
      },
      onError: (e) => toast.error(`Failed to update photo: ${e.message}`),
    }),
  );

  async function onSubmit(values: FormValues) {
    if (!photo) return;

    await Promise.all([
      updatePost.mutateAsync({
        id: post.id,
        title: values.postTitle,
        visibility: values.postVisibility,
        tags: values.tags,
      }),
      updatePhoto.mutateAsync({
        id: photo.id,
        title: values.title,
        make: values.make,
        model: values.model,
        lensModel: values.lensModel,
        focalLength: values.focalLength,
        focalLength35mm: values.focalLength35mm,
        fNumber: values.fNumber,
        iso: values.iso,
        exposureTime: values.exposureTime,
        exposureCompensation: values.exposureCompensation,
        dateTimeOriginal: values.dateTimeOriginal || undefined,
        latitude: values.latitude,
        longitude: values.longitude,
        gpsAltitude: values.gpsAltitude,
      }),
    ]);

    router.push('/dashboard/posts');
  }

  const isPending = updatePost.isPending || updatePhoto.isPending;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className='space-y-8 max-w-4xl'
      >
        <Card>
          <CardHeader>
            <CardTitle>Post Settings</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <FormField
              control={form.control}
              name='postTitle'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Post Title</FormLabel>
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

        <Card>
          <CardHeader>
            <CardTitle>Photo Metadata</CardTitle>
          </CardHeader>
          <CardContent className='space-y-6'>
            {photo && (
              <div className='relative h-64 w-full overflow-hidden rounded-lg border bg-muted'>
                <BlurImage
                  blurhash={photo.blurData}
                  src={keyToUrl(photo.url)}
                  alt={photo.title}
                  fill
                  className='object-contain'
                  unoptimized
                />
              </div>
            )}

            <FormField
              control={form.control}
              name='title'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Photo Title</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='space-y-4 border-t pt-4'>
              <div className='flex items-center justify-between'>
                <h3 className='text-sm font-semibold'>EXIF Data</h3>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => setIsEditExif(!isEditExif)}
                >
                  {isEditExif ? 'Hide EXIF Editor' : 'Edit EXIF'}
                </Button>
              </div>

              {!isEditExif ? (
                <div className='mt-4 border border-border/80 rounded-sm p-4 w-full'>
                  <ExifPreview
                    exif={form.getValues() as unknown as TExifData}
                    showLogo={false}
                  />
                </div>
              ) : (
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-top-2 duration-200'>
                  <FormField
                    control={form.control}
                    name='make'
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='model'
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='lensModel'
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='focalLength'
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
                    name='focalLength35mm'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Focal Length 35mm (mm)</FormLabel>
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
                    name='fNumber'
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
                    name='exposureTime'
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
                    name='iso'
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
                    name='exposureCompensation'
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
                    name='dateTimeOriginal'
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
            </div>
          </CardContent>
        </Card>

        <div className='flex justify-end gap-4'>
          <Button type='button' variant='ghost' onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type='submit' disabled={isPending}>
            {isPending ? 'Updating...' : 'Update Post & Photo'}
          </Button>
        </div>
      </form>
    </Form>
  );
};
