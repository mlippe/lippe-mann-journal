import Link from 'next/link';
import {
  IconArrowLeft,
  IconCameraOff,
  IconFolders,
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { FeedPreview } from '@/modules/home/ui/components/feed-preview';
import Footer from '@/components/footer';

interface NotFoundViewProps {
  title?: string;
  description?: string;
}

export function NotFoundView({
  title = 'Dieser Eintrag oder Pfad existiert nicht.',
  description = 'Vielleicht wurde der Beitrag verschoben, ist auf privat gestellt oder die Adresse hat sich geändert.',
}: NotFoundViewProps) {
  return (
    <div className='flex flex-col w-full'>
      <section className='w-full max-w-4xl mx-auto pt-8 sm:pt-14 pb-16 sm:pb-24 px-2'>
        {/* Editorial Contact Sheet / Unexposed Frame Card */}
        <div className='relative overflow-hidden rounded-xs border border-border/60 bg-muted/15 p-6 sm:p-10 md:p-14'>
          {/* Film Edge Top Bar */}
          <div className='flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground/70 pb-6 mb-8 border-b border-border/40'>
            <span className='inline-flex items-center gap-2'>
              <span className='size-1.5 rounded-full bg-primary/80' />
              <span>AUFNAHME 00 / 404</span>
            </span>
            <span>KEIN NEGATIV GEFUNDEN</span>
          </div>

          <div className='max-w-xl space-y-5'>
            <div className='inline-flex items-center justify-center size-11 rounded-full border border-border/60 bg-background/80 text-muted-foreground'>
              <IconCameraOff className='size-5 stroke-[1.5]' />
            </div>

            <div className='space-y-2.5'>
              <h1 className='text-2xl sm:text-3xl md:text-4xl font-medium tracking-[-0.025em] text-foreground leading-[1.15]'>
                {title}
              </h1>
              <p className='text-sm sm:text-base text-muted-foreground leading-relaxed'>
                {description}
              </p>
            </div>

            <div className='pt-3 flex flex-wrap items-center gap-3'>
              <Button
                asChild
                className='rounded-full px-5 font-mono text-xs uppercase tracking-[0.14em]'
              >
                <Link href='/'>
                  <IconArrowLeft className='size-3.5 mr-1.5' />
                  <span>Zum Journal-Feed</span>
                </Link>
              </Button>

              <Button
                asChild
                variant='outline'
                className='rounded-full px-5 font-mono text-xs uppercase tracking-[0.14em] border-border/70 hover:bg-muted'
              >
                <Link href='/collections'>
                  <IconFolders className='size-3.5 mr-1.5' />
                  <span>Sammlungen ansehen</span>
                </Link>
              </Button>
            </div>
          </div>

          {/* Film Edge Bottom Markings */}
          <div className='mt-10 pt-4 border-t border-border/30 flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground/50 select-none'>
            <span>LIPPE &amp; MANN JOURNAL</span>
            <span>35MM · LEERAUFNAHME</span>
          </div>
        </div>
      </section>

      {/* Live Feed Preview so visitors can immediately explore stories */}
      <div className='w-full px-2'>
        <FeedPreview limit={3} />
      </div>

      <div className='mt-20 w-full'>
        <Footer />
      </div>
    </div>
  );
}
