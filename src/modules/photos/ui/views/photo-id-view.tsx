'use client';

import { FramedPhoto } from '@/components/framed-photo';
import { photosUpdateSchema } from '@/db/schema';
import { useTRPC } from '@/trpc/client';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

import { ApertureSelector } from '../components/aperture-selector';
import { ShutterSpeedSelector } from '../components/shutter-speed-selector';
import { ISOSelector } from '../components/iso-selector';
import { ExposureCompensationSelector } from '../components/exposure-compensation-selector';
import { formatExifDate } from '../../lib/utils';

interface PhotoIdViewProps {
  id: string;
}

const formSchema = photosUpdateSchema.extend({
  make: z.string().optional(),
  model: z.string().optional(),
  lensModel: z.string().optional(),
  focalLength: z.number().optional(),
  focalLength35mm: z.number().optional(),
  fNumber: z.number().optional(),
  iso: z.number().optional(),
  exposureTime: z.number().optional(),
  exposureCompensation: z.number().optional(),
});

export const PhotoIdView = ({ id }: PhotoIdViewProps) => {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data } = useSuspenseQuery(
    trpc.photos.getOne.queryOptions({
      id,
    }),
  );

  const updateMutation = useMutation(
    trpc.photos.update.mutationOptions({
      onSuccess: () => {
        toast.success('Foto erfolgreich aktualisiert');
        queryClient.invalidateQueries(trpc.photos.getMany.queryOptions({}));
        router.refresh();
        router.push('/dashboard/photos');
      },
      onError: (err) => {
        toast.error(err.message || 'Fehler beim Aktualisieren des Fotos');
      },
    }),
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: data.id,
      title: data.title ?? '',
      latitude: data.latitude ?? undefined,
      longitude: data.longitude ?? undefined,
      make: data.make ?? undefined,
      model: data.model ?? undefined,
      lensModel: data.lensModel ?? undefined,
      focalLength: data.focalLength ?? undefined,
      focalLength35mm: data.focalLength35mm ?? undefined,
      fNumber: data.fNumber ?? undefined,
      iso: data.iso ?? undefined,
      exposureTime: data.exposureTime ?? undefined,
      exposureCompensation: data.exposureCompensation ?? undefined,
    },
  });

  const isSubmitting = updateMutation.isPending;

  function onSubmit(values: z.infer<typeof formSchema>) {
    updateMutation.mutate({ ...values, id: data.id });
  }

  const takenAt = data.dateTimeOriginal
    ? formatExifDate(data.dateTimeOriginal, 'dd.MM.yyyy')
    : null;

  return (
    <div className='min-h-screen bg-background'>
      <div className='container mx-auto px-4 py-8'>
        <div className='mb-6 flex items-baseline justify-between gap-4'>
          <div>
            <h1 className='text-2xl font-semibold tracking-tight'>
              {data.title || 'Ohne Titel'}
            </h1>
            {takenAt && (
              <p className='text-sm text-muted-foreground'>
                Aufgenommen am {takenAt}
              </p>
            )}
          </div>
        </div>

        <div className='grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.6fr)] items-start'>
          {/* Form on the left */}
          <div className='bg-card border rounded-xl p-6 shadow-sm w-full'>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className='space-y-6'
              >
                <FormField
                  control={form.control}
                  name='title'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Titel</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder='Fototitel' />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Camera parameters */}
                <div className='space-y-4 border-t pt-4'>
                  <div>
                    <h3 className='text-sm font-semibold'>Kamera-Parameter</h3>
                    <p className='mt-1 text-xs text-muted-foreground'>
                      Automatisch aus den EXIF-Daten ausgelesen. Du kannst die
                      Werte manuell anpassen.
                    </p>
                  </div>
                  <div className='grid gap-4 md:grid-cols-2'>
                    <FormField
                      control={form.control}
                      name='make'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kamera-Hersteller</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder='z. B. Canon' />
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
                          <FormLabel>Kameramodell</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder='z. B. EOS R5' />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name='lensModel'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Objektiv</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder='z. B. RF 24-70mm f/2.8L'
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className='grid gap-4 md:grid-cols-2'>
                    <FormField
                      control={form.control}
                      name='focalLength'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Brennweite (mm)</FormLabel>
                          <FormControl>
                            <Input
                              type='number'
                              step={1}
                              value={field.value ?? ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                field.onChange(
                                  value === '' ? undefined : Number(value),
                                );
                              }}
                              placeholder='50'
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='focalLength35mm'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>KB-Äquivalent (mm)</FormLabel>
                          <FormControl>
                            <Input
                              type='number'
                              step={1}
                              value={field.value ?? ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                field.onChange(
                                  value === '' ? undefined : Number(value),
                                );
                              }}
                              placeholder='50'
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className='grid gap-4 md:grid-cols-2'>
                    <FormField
                      control={form.control}
                      name='fNumber'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Blende</FormLabel>
                          <FormControl>
                            <ApertureSelector
                              value={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='exposureTime'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Verschlusszeit</FormLabel>
                          <FormControl>
                            <ShutterSpeedSelector
                              value={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className='grid gap-4 md:grid-cols-2'>
                    <FormField
                      control={form.control}
                      name='iso'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ISO</FormLabel>
                          <FormControl>
                            <ISOSelector
                              value={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='exposureCompensation'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Belichtungskorrektur (EV)</FormLabel>
                          <FormControl>
                            <ExposureCompensationSelector
                              value={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className='grid gap-4 md:grid-cols-2'>
                  <FormField
                    control={form.control}
                    name='latitude'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Breitengrad (Latitude)</FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            step='any'
                            value={field.value ?? ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              const numericValue =
                                value === '' ? undefined : Number(value);
                              field.onChange(numericValue);
                            }}
                            placeholder='z. B. 37.7749'
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='longitude'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Längengrad (Longitude)</FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            step='any'
                            value={field.value ?? ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              const numericValue =
                                value === '' ? undefined : Number(value);
                              field.onChange(numericValue);
                            }}
                            placeholder='z. B. -122.4194'
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className='flex justify-end pt-2'>
                  <Button type='submit' disabled={isSubmitting}>
                    {isSubmitting ? 'Wird gespeichert...' : 'Änderungen speichern'}
                  </Button>
                </div>
              </form>
            </Form>
          </div>

          {/* Photo + Map on the right */}
          <div className='space-y-4'>
            <div className='flex items-center justify-center bg-gray-50 dark:bg-muted rounded-xl p-6'>
              <FramedPhoto
                src={data.url}
                alt={data.title}
                blurhash={data.blurData}
                width={data.width}
                height={data.height}
                className='max-h-[50vh]'
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
