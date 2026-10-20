'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTRPC } from '@/trpc/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { collectionsInsertSchema } from '@/db/schema';
import { generateSlug } from '@/modules/articles/lib/utils';
import FileUploader from '@/modules/s3/ui/components/file-uploader';
import { Collection } from '@/db/schema';

const formSchema = collectionsInsertSchema;

interface CollectionFormProps {
  collection?: Collection;
}

export const CollectionForm = ({ collection }: CollectionFormProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();

  const createCollection = useMutation(
    trpc.collections.create.mutationOptions({
      onSuccess: () => {
        toast.success('Sammlung erfolgreich erstellt');
        queryClient.invalidateQueries(trpc.collections.getAllCollections.queryOptions());
        router.refresh();
        router.push('/dashboard/collections');
      },
      onError: (e) => toast.error(`Fehler beim Erstellen der Sammlung: ${e.message}`),
    }),
  );

  const updateCollection = useMutation(
    trpc.collections.update.mutationOptions({
      onSuccess: () => {
        toast.success('Sammlung erfolgreich aktualisiert');
        queryClient.invalidateQueries(trpc.collections.getAllCollections.queryOptions());
        if (collection) {
           queryClient.invalidateQueries(trpc.collections.getCollectionBySlug.queryOptions({ slug: collection.slug }));
        }
        router.refresh();
        router.push('/dashboard/collections');
      },
      onError: (e) => toast.error(`Fehler beim Aktualisieren der Sammlung: ${e.message}`),
    }),
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: collection?.id,
      name: collection?.name || '',
      slug: collection?.slug || '',
      description: collection?.description || '',
      coverImageUrl: collection?.coverImageUrl || '',
      isFeatured: collection?.isFeatured || false,
    },
  });

  const name = form.watch('name');

  useEffect(() => {
    if (name && !collection) {
      form.setValue('slug', generateSlug(name));
    }
  }, [name, form, collection]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (collection) {
      updateCollection.mutate(values);
    } else {
      createCollection.mutate(values);
    }
  };

  const isPending = createCollection.isPending || updateCollection.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6 max-w-2xl'>
        <FormField
          control={form.control}
          name='name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder='Name der Sammlung' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='slug'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slug</FormLabel>
              <FormControl>
                <Input placeholder='sammlung-slug' {...field} disabled={!!collection} />
              </FormControl>
              <FormDescription>
                Der eindeutige URL-Bezeichner für diese Sammlung.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='description'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Beschreibung</FormLabel>
              <FormControl>
                <Textarea
                  placeholder='Beschreibe diese Sammlung...'
                  className='resize-none'
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='coverImageUrl'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Titelbild</FormLabel>
              <FormControl>
                <FileUploader
                  onUploadSuccess={(key) => field.onChange(key)}
                  folder='collections'
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='isFeatured'
          render={({ field }) => (
            <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
              <div className='space-y-0.5'>
                <FormLabel className='text-base'>Hervorgehoben</FormLabel>
                <FormDescription>
                  Diese Sammlung auf der Startseite hervorheben.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <Button type='submit' disabled={isPending}>
          {collection ? 'Sammlung aktualisieren' : 'Sammlung erstellen'}
        </Button>
      </form>
    </Form>
  );
};
