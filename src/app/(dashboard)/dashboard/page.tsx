import { Suspense } from 'react';
import { trpc } from '@/trpc/server';
import { getQueryClient } from '@/trpc/server';
import { ErrorBoundary } from 'react-error-boundary';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import {
  ChartAreaView,
  ChartAreaLoading,
} from '@/modules/dashboard/ui/views/chart-area-view';
import {
  SectionCardsView,
  SectionCardsLoading,
} from '@/modules/dashboard/ui/views/section-cards-view';
import { NewPostView } from '@/modules/dashboard/ui/views/new-post-view';

import {
  IconArrowUpRight,
  IconChartLine,
  IconChecklist,
  IconFolder,
  IconPlus,
} from '@tabler/icons-react';
import Link from 'next/link';

const page = async () => {
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(
    trpc.dashboard.getPhotosCountByMonth.queryOptions({ years: 3 }),
  );
  void queryClient.prefetchQuery(
    trpc.dashboard.getDashboardStats.queryOptions(),
  );

  return (
    <div className='py-4 px-4 md:px-8 flex flex-col'>
      <div>
        <h1 className='text-2xl font-bold'>Overview</h1>
        <p className='text-muted-foreground text-sm'>
          See your photos, travel history, and more.
        </p>
      </div>
      <div className='@container/main flex flex-1 flex-col'>
        <div className='flex flex-col gap-6 py-4 md:gap-8 md:py-6'>
          <HydrationBoundary state={dehydrate(queryClient)}>
            {/* 1. CREATE NEW SECTION */}
            <section className='space-y-2.5'>
              <div className='flex items-center gap-2'>
                <span className='text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5'>
                  <IconPlus className='size-3.5 text-primary' />
                  Neu erstellen
                </span>
                <div className='h-px flex-1 bg-border/40' />
              </div>
              <NewPostView />
            </section>

            {/* 2. EXISTING ENTRIES SHORTCUTS SECTION */}
            <section className='space-y-2.5'>
              <div className='flex items-center gap-2'>
                <span className='text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5'>
                  <IconFolder className='size-3.5 text-primary' />
                  Bestehende Einträge
                </span>
                <div className='h-px flex-1 bg-border/40' />
              </div>
              <Suspense fallback={<SectionCardsLoading />}>
                <SectionCardsView />
              </Suspense>
            </section>

            {/* 3. SUBSTANZ-CHECKLISTE COMPANION BANNER */}
            <Link
              href='/dashboard/substanz-checklist'
              className='group block active:scale-[0.99] transition-all'
            >
              <div className='p-3.5 sm:p-4 rounded-lg border border-border/70 bg-muted/20 hover:bg-muted/40 hover:border-primary/40 transition-all flex items-center justify-between gap-3 shadow-2xs'>
                <div className='flex items-center gap-2.5 sm:gap-3 min-w-0'>
                  <div className='p-2 rounded-md bg-primary/10 text-primary shrink-0'>
                    <IconChecklist className='size-4 sm:size-5' />
                  </div>
                  <div className='space-y-0.5 min-w-0'>
                    <div className='flex items-center gap-2'>
                      <span className='text-xs sm:text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate'>
                        Substanz-Checkliste
                      </span>
                      <span className='text-[10px] font-mono uppercase bg-primary/10 text-primary px-1.5 py-0.2 rounded-xs font-semibold'>
                        Leitfaden
                      </span>
                    </div>
                    <p className='text-xs font-serif italic text-muted-foreground truncate'>
                      Hinsehen, solange es da ist. Zeigen, was ich festhalten konnte.
                    </p>
                  </div>
                </div>

                <div className='flex items-center gap-1 text-xs font-mono text-muted-foreground group-hover:text-primary shrink-0'>
                  <span className='hidden sm:inline'>Öffnen</span>
                  <IconArrowUpRight className='size-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all' />
                </div>
              </div>
            </Link>

            {/* 3. ACTIVITY SECTION */}
            <section className='space-y-2.5'>
              <div className='flex items-center gap-2'>
                <span className='text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5'>
                  <IconChartLine className='size-3.5 text-primary' />
                  Aktivität
                </span>
                <div className='h-px flex-1 bg-border/40' />
              </div>
              <Suspense fallback={<ChartAreaLoading />}>
                <ErrorBoundary fallback={<p>Error</p>}>
                  <ChartAreaView />
                </ErrorBoundary>
              </Suspense>
            </section>
          </HydrationBoundary>
        </div>
      </div>
    </div>
  );
};

export default page;
