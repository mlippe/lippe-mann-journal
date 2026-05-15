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
        toast.success('Collection created');
        queryClient.invalidateQueries(trpc.collections.getAllCollections.queryOptions());
        router.push('/dashboard/collections');
      },
      onError: (e) => toast.error(`Failed to create collection: ${e.message}`),
    }),
  );

  const updateCollection = useMutation(
    trpc.collections.update.mutationOptions({
      onSuccess: () => {
        toast.success('Collection updated');
        queryClient.invalidateQueries(trpc.collections.getAllCollections.queryOptions());
        if (collection) {
           queryClient.invalidateQueries(trpc.collections.getCollectionBySlug.queryOptions({ slug: collection.slug }));
        }
      },
      onError: (e) => toast.error(`Failed to update collection: ${e.message}`),
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
                <Input placeholder='Collection name' {...field} />
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
                <Input placeholder='collection-slug' {...field} disabled={!!collection} />
              </FormControl>
              <FormDescription>
                The unique URL identifier for this collection.
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
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder='Tell us more about this collection...'
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
              <FormLabel>Cover Image</FormLabel>
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
                <FormLabel className='text-base'>Featured</FormLabel>
                <FormDescription>
                  Display this collection in the home page story feed.
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
          {collection ? 'Update Collection' : 'Create Collection'}
        </Button>
      </form>
    </Form>
  );
};
