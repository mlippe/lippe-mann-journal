'use client';

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
import { postFormSchema } from '../../schemas';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PostGetOne } from '../../types';
import { generateSlug } from '../../lib/utils';
import { useEffect } from 'react';
import FileUploader from '@/modules/s3/ui/components/file-uploader';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TagsInput } from './tags-input';
import { CollectionSelect } from '@/modules/posts/ui/components/collection-select';

import { useTRPC } from '@/trpc/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import TiptapEditor from '@/components/editor';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const formSchema = postFormSchema;

interface ArticleFormProps {
  post?: PostGetOne;
}

export const ArticleForm = ({ post }: ArticleFormProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();

  const createArticle = useMutation(
    trpc.posts.create.mutationOptions({
      onSuccess: async (data) => {
        toast.success('Article created successfully');
        await queryClient.invalidateQueries(
          trpc.posts.getMany.queryOptions({}),
        );
        await queryClient.invalidateQueries(trpc.blog.getMany.queryOptions());
        form.reset();
        router.push(`/dashboard/posts/${data.slug}`);
      },
      onError: (e) => {
        toast.error('Failed to create article', {
          description: e.message,
        });
      },
    }),
  );

  const updateArticle = useMutation(
    trpc.posts.update.mutationOptions({
      onSuccess: async (data) => {
        toast.success('Article updated successfully');
        await queryClient.invalidateQueries(
          trpc.posts.getOne.queryOptions({ slug: data.slug }),
        );
        await queryClient.invalidateQueries(
          trpc.posts.getMany.queryOptions({}),
        );
        await queryClient.invalidateQueries(trpc.blog.getMany.queryOptions());
        form.reset();
        router.push(`/dashboard/posts/${data.slug}`);
      },
      onError: (e) => {
        toast.error('Failed to update article', {
          description: e.message,
        });
      },
    }),
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: post?.title || '',
      slug: post?.slug || '',
      content: post?.content || '',
      visibility: post?.visibility || 'public',
      coverImage: post?.coverImage || '',
      tags: post?.tags || [],
      collectionIds:
        post?.postsToCollections?.map((ptc) => ptc.collection.id) || [],
    },
  });

  const title = form.watch('title');

  useEffect(() => {
    if (title) {
      const slug = generateSlug(title);
      form.setValue('slug', slug);
    }
  }, [title, form]);

  const isPending = createArticle.isPending || updateArticle.isPending;

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (post) {
      updateArticle.mutate({ ...values, id: post.id });
    } else {
      createArticle.mutate({ ...values, type: 'ARTICLE' });
    }
  }

  return (
    <div className='max-w-screen-xl mx-auto'>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className='flex flex-col lg:flex-row gap-10 items-start'
        >
          {/* Main Content Area */}
          <div className='flex-1 w-full space-y-8'>
            <div className='space-y-4'>
              <FormField
                control={form.control}
                name='title'
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        placeholder='Article Title'
                        className='text-4xl lg:text-5xl font-bold border-none px-0 focus-visible:ring-0 placeholder:opacity-30 h-auto py-2 bg-transparent shadow-none'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='slug'
                render={({ field }) => (
                  <FormItem className='flex items-center gap-2 text-muted-foreground text-sm'>
                    <span className='whitespace-nowrap opacity-50 font-medium uppercase tracking-wider text-[10px]'>
                      URL Slug:
                    </span>
                    <FormControl>
                      <input
                        className='bg-transparent border-none p-0 focus:outline-none focus:ring-0 w-full disabled:opacity-100'
                        {...field}
                        disabled
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            <FormField
              control={form.control}
              name='coverImage'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-muted-foreground uppercase tracking-wider text-[10px] font-bold'>
                    Cover Image
                  </FormLabel>
                  <FormControl>
                    <FileUploader
                      onUploadSuccess={(key) => {
                        field.onChange(key);
                      }}
                      folder='posts'
                      value={field.value}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='content'
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className='min-h-[500px] prose prose-lg dark:prose-invert max-w-none'>
                      <TiptapEditor
                        content={field.value || ''}
                        onChange={field.onChange}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Sidebar Settings */}
          <aside className='w-full lg:w-80 space-y-8 lg:sticky lg:top-24'>
            <div className='p-6 rounded-2xl bg-muted/30 border space-y-6'>
              <div className='space-y-4'>
                <h3 className='text-sm font-bold uppercase tracking-widest opacity-50'>
                  Publish Settings
                </h3>

                <FormField
                  control={form.control}
                  name='visibility'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-xs'>Visibility</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className='bg-background'>
                            <SelectValue placeholder='Select visibility' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='public'>Public</SelectItem>
                          <SelectItem value='private'>Private</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='collectionIds'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-xs'>Collections</FormLabel>
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
                  name='tags'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-xs'>Tags</FormLabel>
                      <FormControl>
                        <TagsInput
                          value={Array.isArray(field.value) ? field.value : []}
                          onChange={(tags) => field.onChange(tags)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button
                type='submit'
                className='w-full h-12 text-base font-bold rounded-xl'
                disabled={isPending}
              >
                {post ? 'Update Article' : 'Publish Article'}
              </Button>
            </div>

            {post && (
              <div className='px-6 py-4 text-[10px] text-muted-foreground uppercase tracking-widest flex justify-between border rounded-2xl border-dashed'>
                <span>Created: {format(post.createdAt, 'MMM d, yyyy')}</span>
              </div>
            )}
          </aside>
        </form>
      </Form>
    </div>
  );
};
