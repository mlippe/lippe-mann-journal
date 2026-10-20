'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PostGetOne } from '@/modules/posts/types';
import { useTRPC } from '@/trpc/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { TagsInput } from '@/modules/articles/ui/components/tags-input';
import { CollectionSelect } from '@/modules/posts/ui/components/collection-select';
import {
  IconCamera,
  IconRotateClockwise,
  IconExternalLink,
  IconCheck,
  IconLoader2,
} from '@tabler/icons-react';

export const SessionPostEdit = ({ post }: { post: PostGetOne }) => {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content || '');
  const [visibility, setVisibility] = useState<'public' | 'private'>(
    post.visibility as 'public' | 'private',
  );
  const [tags, setTags] = useState<string[]>(post.tags || []);
  const [collectionIds, setCollectionIds] = useState<string[]>(
    post.postsToCollections?.map((ptc) => ptc.collection.id) || [],
  );

  const updatePost = useMutation(trpc.posts.update.mutationOptions());

  const photos = post.postsToPhotos || [];
  const totalFrames = photos.length;
  const initialPicks = photos.filter(
    (p) => (p as { isInitialPick?: boolean }).isInitialPick,
  ).length;
  const revisitedPicks = photos.filter(
    (p) => (p as { isRevisitedPick?: boolean }).isRevisitedPick,
  ).length;
  const hasRevisitedCut = revisitedPicks > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      await updatePost.mutateAsync({
        id: post.id,
        title: title.trim(),
        content: content.trim() || undefined,
        visibility,
        tags,
        collectionIds,
      });

      await Promise.all([
        queryClient.invalidateQueries(trpc.posts.getOne.queryOptions({ slug: post.slug })),
        queryClient.invalidateQueries(trpc.posts.getMany.queryOptions({})),
        queryClient.invalidateQueries(trpc.posts.getPublished.queryOptions({})),
        queryClient.invalidateQueries(trpc.blog.getMany.queryOptions()),
      ]);

      toast.success('Session erfolgreich aktualisiert!');
      router.refresh();
    } catch (error) {
      console.error('Session update error:', error);
      toast.error(
        error instanceof Error ? error.message : 'Fehler beim Speichern',
      );
    }
  };

  return (
    <div className='max-w-3xl mx-auto space-y-8 pb-24'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/70 pb-6'>
        <div>
          <div className='flex items-center gap-2 text-xs font-mono text-primary uppercase tracking-widest font-semibold mb-1'>
            <IconCamera className='size-4' />
            <span>Session bearbeiten</span>
          </div>
          <h1 className='text-2xl sm:text-3xl font-bold tracking-tight'>
            {post.title}
          </h1>
          <p className='text-xs sm:text-sm text-muted-foreground mt-1'>
            {totalFrames} Frames · {initialPicks} Initial Picks
            {hasRevisitedCut ? ` · ${revisitedPicks} Revisited Picks` : ''}
          </p>
        </div>

        <div className='flex items-center gap-2'>
          <Button variant='outline' size='sm' asChild>
            <Link href={`/session/${post.slug}`} target='_blank'>
              <IconExternalLink className='size-4 mr-1.5' />
              <span>Live ansehen</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Revisit Studio Callout Banner */}
      <div className='rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-500/[0.04] to-amber-500/[0.04] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div className='space-y-1'>
          <div className='flex items-center gap-2 font-semibold text-sm sm:text-base'>
            <IconRotateClockwise className='size-5 text-red-500' />
            <span>
              {hasRevisitedCut
                ? `Revisited Cut aktiv (${revisitedPicks} Frames)`
                : 'Bereit für den zweiten Blick?'}
            </span>
          </div>
          <p className='text-xs sm:text-sm text-muted-foreground max-w-md'>
            {hasRevisitedCut
              ? 'Passe deine spätere Auswahl oder deine Retrospektiv-Notizen jederzeit im Revisit Studio an.'
              : 'Kuriere deine Bilder mit zeitlichem Abstand über den digitalen Leuchttisch neu.'}
          </p>
        </div>

        <Button
          asChild
          className='bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl shrink-0'
        >
          <Link href={`/dashboard/posts/${post.slug}/revisit`}>
            <IconRotateClockwise className='size-4 mr-1.5' />
            <span>{hasRevisitedCut ? 'Revisited Cut bearbeiten' : 'Revisit Studio öffnen'}</span>
          </Link>
        </Button>
      </div>

      {/* Edit Form */}
      <form onSubmit={handleSubmit} className='space-y-6'>
        <div className='space-y-2'>
          <Label htmlFor='title'>Titel</Label>
          <Input
            id='title'
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className='h-11'
          />
        </div>

        <div className='space-y-2'>
          <Label htmlFor='content'>Field Dispatch / Notizen</Label>
          <Textarea
            id='content'
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder='Gedanken, Wetter, Ort oder Kontext der Session...'
          />
        </div>

        <div className='space-y-2'>
          <Label>Tags</Label>
          <TagsInput value={tags} onChange={setTags} />
        </div>

        <div className='space-y-2'>
          <Label>Kollektionen</Label>
          <CollectionSelect value={collectionIds} onChange={setCollectionIds} />
        </div>

        <div className='flex items-center justify-between p-4 rounded-xl border border-border/70 bg-card'>
          <div className='space-y-0.5'>
            <Label className='text-sm font-medium'>Öffentlich sichtbar</Label>
            <p className='text-xs text-muted-foreground'>
              Soll die Session im Journal für alle Besucher sichtbar sein?
            </p>
          </div>
          <Switch
            checked={visibility === 'public'}
            onCheckedChange={(checked) =>
              setVisibility(checked ? 'public' : 'private')
            }
          />
        </div>

        <div className='pt-4'>
          <Button
            type='submit'
            disabled={!title.trim() || updatePost.isPending}
            className='w-full sm:w-auto px-8 h-11 font-semibold rounded-xl'
          >
            {updatePost.isPending ? (
              <>
                <IconLoader2 className='size-4 mr-2 animate-spin' />
                <span>Wird gespeichert...</span>
              </>
            ) : (
              <>
                <IconCheck className='size-4 mr-2' />
                <span>Änderungen speichern</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};
