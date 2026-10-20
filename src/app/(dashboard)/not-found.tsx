import Link from 'next/link';
import { IconArrowLeft, IconCameraOff } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';

export default function DashboardNotFound() {
  return (
    <div className='py-12 px-4 md:px-8 flex flex-col items-center justify-center min-h-[60vh] text-center'>
      <div className='max-w-md space-y-4 rounded-xl border border-dashed border-border/70 bg-muted/20 p-8'>
        <div className='mx-auto size-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground'>
          <IconCameraOff className='size-5' />
        </div>
        <div className='space-y-1.5'>
          <p className='text-[11px] font-mono uppercase tracking-widest text-muted-foreground'>
            404 · Nicht gefunden
          </p>
          <h1 className='text-xl font-bold tracking-tight'>
            Eintrag nicht gefunden
          </h1>
          <p className='text-xs sm:text-sm text-muted-foreground'>
            Der gesuchte Beitrag, das Foto oder die Sammlung existiert nicht mehr.
          </p>
        </div>
        <div className='pt-2 flex items-center justify-center gap-2'>
          <Button asChild size='sm'>
            <Link href='/dashboard'>
              <IconArrowLeft className='size-4 mr-1.5' />
              Zur Übersicht
            </Link>
          </Button>
          <Button asChild variant='outline' size='sm'>
            <Link href='/dashboard/posts'>Alle Beiträge</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
