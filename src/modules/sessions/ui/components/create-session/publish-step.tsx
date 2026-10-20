'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { TagsInput } from '@/modules/articles/ui/components/tags-input';
import { CollectionSelect } from '@/modules/posts/ui/components/collection-select';
import { SessionPhotoDraft } from './types';
import {
  IconArrowLeft,
  IconCheck,
  IconLoader2,
  IconAlertCircle,
  IconCamera,
} from '@tabler/icons-react';

interface PublishStepProps {
  photos: SessionPhotoDraft[];
  onBack: () => void;
  onSubmit: (data: {
    title: string;
    slug?: string;
    content?: string;
    visibility: 'public' | 'private';
    tags: string[];
    collectionIds: string[];
  }) => void;
  isSubmitting: boolean;
  onRetryFailedUploads?: () => void;
}

export const PublishStep = ({
  photos,
  onBack,
  onSubmit,
  isSubmitting,
  onRetryFailedUploads,
}: PublishStepProps) => {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [tags, setTags] = useState<string[]>([]);
  const [collectionIds, setCollectionIds] = useState<string[]>([]);

  const totalFrames = photos.length;
  const uploadedFrames = photos.filter((p) => p.isUploaded).length;
  const failedFrames = photos.filter((p) => p.uploadError).length;
  const isUploading = photos.some((p) => p.isUploading);
  const allUploaded = uploadedFrames === totalFrames;
  const pickedCount = photos.filter((p) => p.isInitialPick).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !allUploaded) return;

    onSubmit({
      title: title.trim(),
      slug: slug.trim() || undefined,
      content: content.trim() || undefined,
      visibility,
      tags,
      collectionIds,
    });
  };

  return (
    <div className='w-full max-w-2xl mx-auto pb-24 space-y-8'>
      {/* Step Header */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/60 pb-4'>
        <div>
          <h2 className='text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2'>
            <IconCamera className='size-6 text-primary' />
            <span>Dispatch & Veröffentlichen</span>
          </h2>
          <p className='text-xs sm:text-sm text-muted-foreground mt-0.5'>
            Gib deiner Session einen Titel, Notizen und Metadaten.
          </p>
        </div>

        <Button variant='ghost' size='sm' onClick={onBack}>
          <IconArrowLeft className='size-4 mr-1' />
          Zurück zum Pacing
        </Button>
      </div>

      {/* Cloud Upload Status Card */}
      <div className='rounded-xl border border-border/70 p-4 bg-card/60 space-y-3'>
        <div className='flex items-center justify-between text-xs font-mono'>
          <span className='font-semibold flex items-center gap-2'>
            {allUploaded ? (
              <IconCheck className='size-4 text-emerald-500' />
            ) : isUploading ? (
              <IconLoader2 className='size-4 text-primary animate-spin' />
            ) : failedFrames > 0 ? (
              <IconAlertCircle className='size-4 text-destructive' />
            ) : null}
            <span>R2 Cloud-Speicher Status</span>
          </span>
          <span className='text-muted-foreground tabular-nums'>
            {uploadedFrames} / {totalFrames} Frames synchronisiert
          </span>
        </div>

        {/* Progress Bar */}
        <div className='w-full bg-muted rounded-full h-2 overflow-hidden'>
          <div
            className='bg-primary h-2 transition-all duration-300 rounded-full'
            style={{
              width: `${totalFrames > 0 ? (uploadedFrames / totalFrames) * 100 : 0}%`,
            }}
          />
        </div>

        <div className='flex items-center justify-between text-xs text-muted-foreground'>
          <span>
            Initial Cut: <strong className='text-foreground'>{pickedCount}</strong> von{' '}
            <strong>{totalFrames}</strong> Frames
          </span>

          {failedFrames > 0 && onRetryFailedUploads && (
            <Button
              variant='outline'
              size='sm'
              onClick={onRetryFailedUploads}
              className='h-7 text-xs text-destructive border-destructive/40'
            >
              {failedFrames} Fehler wiederholen
            </Button>
          )}
        </div>
      </div>

      {/* Form Fields */}
      <form onSubmit={handleSubmit} className='space-y-6'>
        {/* Title */}
        <div className='space-y-2'>
          <Label htmlFor='session-title' className='text-sm font-medium'>
            Titel der Session <span className='text-destructive'>*</span>
          </Label>
          <Input
            id='session-title'
            placeholder='z.B. Isarauen im Herbstlicht'
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className='h-11'
          />
        </div>

        {/* Custom Slug (Optional) */}
        <div className='space-y-2'>
          <Label htmlFor='session-slug' className='text-sm font-medium text-muted-foreground'>
            URL-Slug (optional)
          </Label>
          <Input
            id='session-slug'
            placeholder='wird automatisch aus dem Titel generiert'
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className='font-mono text-xs'
          />
        </div>

        {/* Field Dispatch / Commentary */}
        <div className='space-y-2'>
          <Label htmlFor='session-content' className='text-sm font-medium'>
            Field Dispatch / Notizen (optional)
          </Label>
          <Textarea
            id='session-content'
            placeholder='Ein paar Sätze zum Kontext, Licht, Stimmung oder Gedanken beim Shooting...'
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>

        {/* Tags */}
        <div className='space-y-2'>
          <Label className='text-sm font-medium'>Tags</Label>
          <TagsInput value={tags} onChange={setTags} />
        </div>

        {/* Collections */}
        <div className='space-y-2'>
          <Label className='text-sm font-medium'>Kollektionen</Label>
          <CollectionSelect value={collectionIds} onChange={setCollectionIds} />
        </div>

        {/* Visibility */}
        <div className='flex items-center justify-between p-4 rounded-xl border border-border/70 bg-card'>
          <div className='space-y-0.5'>
            <Label className='text-sm font-medium'>Öffentlich sichtbar</Label>
            <p className='text-xs text-muted-foreground'>
              Soll die Session direkt im Journal & Zine Feed erscheinen?
            </p>
          </div>
          <Switch
            checked={visibility === 'public'}
            onCheckedChange={(checked) =>
              setVisibility(checked ? 'public' : 'private')
            }
          />
        </div>

        {/* Submit Button */}
        <div className='pt-4'>
          <Button
            type='submit'
            disabled={!title.trim() || !allUploaded || isSubmitting}
            className='w-full h-12 text-sm font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90'
          >
            {isSubmitting ? (
              <>
                <IconLoader2 className='size-4 mr-2 animate-spin' />
                <span>Session wird veröffentlicht...</span>
              </>
            ) : !allUploaded ? (
              <>
                <IconLoader2 className='size-4 mr-2 animate-spin' />
                <span>Warte auf Cloud-Upload ({uploadedFrames}/{totalFrames})...</span>
              </>
            ) : (
              <span>Session veröffentlichen</span>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};
