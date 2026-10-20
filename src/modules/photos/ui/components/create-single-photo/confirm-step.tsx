'use client';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useForm, FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dispatch, SetStateAction, useState } from 'react';
import { toast } from 'sonner';
import { TExifData, TImageInfo } from '../../../lib/utils';
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
import { ConfirmStepData, confirmStepSchema } from './types';
import { CollectionSelect } from '@/modules/posts/ui/components/collection-select';

const ConfirmStep = ({
  url,
  exif,
  imageInfo,
  isSubmitting,
  setExif,
  createImage,
}: {
  url: string | null;
  exif: TExifData | null;
  imageInfo: TImageInfo | undefined;
  isSubmitting: boolean;
  setExif: Dispatch<SetStateAction<TExifData | null>>;
  createImage: (data: ConfirmStepData) => void;
}) => {
  const [isEditExif, setIsEditExif] = useState<boolean>(false);

  const form = useForm<ConfirmStepData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(confirmStepSchema) as any,
    defaultValues: {
      postTitle: '',
      content: '',
      postVisibility: 'public',
      collectionIds: [],
      title: imageInfo?.fileName || 'Untitled.jpg',
      make: exif?.make,
      model: exif?.model,
      lensModel: exif?.lensModel,
      focalLength: exif?.focalLength,
      focalLength35mm: exif?.focalLength35mm,
      fNumber: exif?.fNumber,
      iso: exif?.iso,
      exposureTime: exif?.exposureTime,
      exposureCompensation: exif?.exposureCompensation,
      latitude: exif?.latitude,
      longitude: exif?.longitude,
      gpsAltitude: exif?.gpsAltitude,
      dateTimeOriginal: exif?.dateTimeOriginal,
    },
    mode: 'onChange',
  });
  const { handleSubmit } = form;

  const onInvalid = (errors: FieldErrors<ConfirmStepData>) => {
    console.error('Photo creation validation errors:', errors);
    if (errors.postTitle) {
      toast.error(errors.postTitle.message || 'Bitte gib einen Beitragstitel ein.');
      return;
    }
    if (errors.title) {
      toast.error(errors.title.message || 'Bitte gib einen Fototitel ein.');
      return;
    }
    toast.error('Bitte überprüfe die Eingaben im Formular.');
  };

  const onSubmit = (data: ConfirmStepData) => {
    if (isEditExif) {
      setExif((prev) => ({
        ...prev,
        make: data.make,
        model: data.model,
        lensModel: data.lensModel,
        focalLength: data.focalLength,
        focalLength35mm: data.focalLength35mm,
        fNumber: data.fNumber,
        iso: data.iso,
        exposureTime: data.exposureTime,
        exposureCompensation: data.exposureCompensation,
        latitude: data.latitude,
        longitude: data.longitude,
        gpsAltitude: data.gpsAltitude,
        dateTimeOriginal: data.dateTimeOriginal,
      }));
      setIsEditExif(false);
      return;
    }

    createImage(data);
  };

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={handleSubmit(onSubmit, onInvalid)}
          className='space-y-4 @container'
        >
          {url && imageInfo && (
            <div className='relative h-40 lg:h-72 w-full overflow-hidden rounded-lg border bg-muted'>
              <BlurImage
                blurhash={imageInfo.blurhash}
                src={keyToUrl(url)}
                alt='Hochgeladenes Foto'
                fill
                className='object-contain w-full h-full'
                unoptimized
              />
            </div>
          )}
          <FormField
            control={form.control}
            name='title'
            render={({ field }) => (
              <FormItem className='mb-10'>
                <FormControl>
                  <Input {...field} placeholder='Fototitel' />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className='gap-6'>
            <div className='space-y-6'>
              <div className='border-t gap-6 pt-6 flex items-end flex-col'>
                <FormField
                  control={form.control}
                  name='postVisibility'
                  render={({ field }) => (
                    <FormItem className='-mb-10'>
                      <div className='flex items-center gap-4'>
                        <div className='flex items-center gap-2'>
                          <span className='text-sm text-muted-foreground'>
                            {field.value === 'public' ? 'Öffentlich' : 'Privat'}
                          </span>
                          <FormControl>
                            <Switch
                              checked={field.value === 'public'}
                              onCheckedChange={(checked) =>
                                field.onChange(checked ? 'public' : 'private')
                              }
                            />
                          </FormControl>
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='postTitle'
                  render={({ field }) => (
                    <FormItem className='w-full'>
                      <FormLabel className='mb-3'>Beitragstitel</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder='Titel des Beitrags'
                        ></Textarea>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='content'
                  render={({ field }) => (
                    <FormItem className='w-full'>
                      <FormLabel className='mb-3'>Story & Feldnotizen (optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value ?? ''}
                          placeholder='Ein paar Zeilen Kontext, Gedanken oder Notizen...'
                          className='min-h-[90px] resize-y'
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='collectionIds'
                  render={({ field }) => (
                    <FormItem className='w-full'>
                      <FormLabel className='mb-3'>Sammlungen</FormLabel>
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
              </div>

              {/* Camera Parameters Section */}

              <div className='space-y-4 border-t pt-4'>
                <div>
                  <h3 className='text-sm font-semibold'>EXIF-Daten</h3>

                  {!isEditExif && (
                    <div className='mt-4 border border-border/80 rounded-sm p-4 w-full'>
                      <ExifPreview exif={exif} showLogo={false} />
                    </div>
                  )}
                </div>
                {isEditExif && (
                  <>
                    <div className='grid grid-cols-2 gap-4'>
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

                    <div className='grid grid-cols-2 gap-4'>
                      <FormField
                        control={form.control}
                        name='focalLength'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Brennweite (mm)</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type='number'
                                step={1}
                                placeholder='50'
                                value={field.value ?? ''}
                                onChange={(e) => {
                                  const val = e.target.value
                                    ? parseFloat(e.target.value)
                                    : undefined;
                                  field.onChange(val);
                                }}
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
                                {...field}
                                type='number'
                                step={1}
                                placeholder='50'
                                value={field.value ?? ''}
                                onChange={(e) => {
                                  const val = e.target.value
                                    ? parseFloat(e.target.value)
                                    : undefined;
                                  field.onChange(val);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className='grid grid-cols-2 gap-4'>
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
                    <div className='grid grid-cols-2 gap-4'>
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
                  </>
                )}
                {!isEditExif ? (
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => setIsEditExif(true)}
                  >
                    EXIF-Daten bearbeiten
                  </Button>
                ) : (
                  <div className='flex gap-2'>
                    <Button type='submit'>EXIF-Daten übernehmen</Button>
                    <Button
                      type='button'
                      variant='secondary'
                      onClick={() => setIsEditExif(false)}
                    >
                      Abbrechen
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className='border-t pt-4'>
            <Button type='submit' disabled={isEditExif || isSubmitting}>
              {!isSubmitting ? 'Foto speichern' : 'Foto wird erstellt...'}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
};

export default ConfirmStep;
