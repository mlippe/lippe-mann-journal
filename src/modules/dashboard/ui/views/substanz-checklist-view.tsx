'use client';

import { useState, useEffect, useId } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  IconChecklist,
  IconRotate,
  IconEye,
  IconSparkles,
  IconCompass,
  IconAdjustmentsCheck,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
}

interface ChecklistSection {
  id: string;
  phaseNumber: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  items: ChecklistItem[];
}

const CHECKLIST_SECTIONS: ChecklistSection[] = [
  {
    id: 'vorher',
    phaseNumber: '01',
    title: 'Vorher',
    subtitle: 'Ankommen, bevor du suchst.',
    icon: IconCompass,
    items: [
      {
        id: 'vorher-1',
        title: 'Eine Frage statt eines Looks.',
        description:
          'Was suche ich heute? „Was ist hier bald weg?“ oder „Wer ist schon wach?“',
      },
      {
        id: 'vorher-2',
        title: 'Erst ankommen, dann sehen.',
        description:
          'Handy in die Tasche, drei Atemzüge. Die Kamera erlaubt das Hinsehen, sie ersetzt es nicht.',
      },
      {
        id: 'vorher-3',
        title: 'Wofür bin ich heute dankbar?',
        description: 'Wer danach sucht, findet es.',
      },
    ],
  },
  {
    id: 'unterwegs',
    phaseNumber: '02',
    title: 'Unterwegs',
    subtitle: 'Nicht jeder Moment muss ein Bild werden.',
    icon: IconEye,
    items: [
      {
        id: 'unterwegs-1',
        title: 'Warum dieser Moment, warum jetzt?',
        description: 'Fällt dir kein Satz dazu ein, schau einfach weiter.',
      },
      {
        id: 'unterwegs-2',
        title: 'Was liegt außerhalb des Rahmens?',
        description: 'Die Wirkung steckt oft in dem, was man nur andeutet.',
      },
      {
        id: 'unterwegs-3',
        title: 'Was gefällt mir hier nicht?',
        description:
          'Einmal bewusst hinsehen. Du musst es nicht zeigen, aber du sollst es gesehen haben.',
      },
      {
        id: 'unterwegs-4',
        title: 'Menschen sind keine Requisiten.',
        description:
          'Frag, hör zu, sei freundlich. Ein Gespräch wiegt mehr als ein Bild.',
      },
      {
        id: 'unterwegs-5',
        title: 'Ein Wort notieren.',
        description:
          'Ein Geruch, ein Geräusch, ein aufgeschnappter Satz. Daraus wird später dein Text.',
      },
      {
        id: 'unterwegs-6',
        title: 'In Bildern der Story denken.',
        description: 'Totale, Detail, Mensch, Überraschung. Was fehlt noch?',
      },
      {
        id: 'unterwegs-7',
        title: 'Erst erleben, dann festhalten.',
        description: 'Senk die Kamera zwischendurch. Der Moment gehört zuerst dir.',
      },
    ],
  },
  {
    id: 'danach',
    phaseNumber: '03',
    title: 'Danach',
    subtitle: 'Auswählen ist auch Haltung.',
    icon: IconAdjustmentsCheck,
    items: [
      {
        id: 'danach-1',
        title: 'Stimmungstest.',
        description:
          'Erzählen alle Bilder dieselbe Stimmung? Dann nimm mindestens ein Gegenbild dazu.',
      },
      {
        id: 'danach-2',
        title: 'Mehr als „schön“.',
        description:
          'Lässt sich jedes Bild mit einem Satz ohne dieses Wort beschreiben? Wenn nicht, fliegt es raus.',
      },
      {
        id: 'danach-3',
        title: 'Weniger, dafür bewusster.',
        description:
          'Sechs Bilder mit einer Frage schlagen fünfzehn mit demselben Gefühl.',
      },
      {
        id: 'danach-4',
        title: 'Schreib wie bei der Festwiese.',
        description:
          'Ein konkretes Detail, eine Haltung. Nicht beschreiben, was man sieht.',
      },
    ],
  },
];

const STORAGE_KEY = 'lippe_mann_substanz_checklist_checked_v1';

export function SubstanzChecklistView() {
  const [checkedIds, setCheckedIds] = useState<Record<string, boolean>>({});
  const [isMounted, setIsMounted] = useState(false);

  // Restore checked items from localStorage on client mount
  useEffect(() => {
    setIsMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setCheckedIds(JSON.parse(stored));
      }
    } catch (e) {
      // Local storage unavailable or failed
    }
  }, []);

  const totalItems = CHECKLIST_SECTIONS.reduce(
    (sum, section) => sum + section.items.length,
    0,
  );
  const checkedCount = Object.values(checkedIds).filter(Boolean).length;
  const progressPercent = Math.round((checkedCount / totalItems) * 100);

  const toggleItem = (id: string) => {
    setCheckedIds((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        // Local storage write failed
      }
      return next;
    });
  };

  const handleReset = () => {
    setCheckedIds({});
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      // Local storage clear failed
    }
    toast.success('Checkliste zurückgesetzt');
  };

  return (
    <div className='w-full max-w-4xl mx-auto space-y-6 sm:space-y-8'>
      {/* Header Manifest */}
      <div className='relative overflow-hidden rounded-xl border border-border/60 bg-muted/20 p-5 sm:p-8 backdrop-blur-xs'>
        <div className='relative z-10 space-y-2'>
          <div className='flex items-center gap-2 text-[11px] font-mono tracking-widest uppercase text-muted-foreground'>
            <IconChecklist className='size-3.5 text-primary' />
            <span>Dokumentarischer Leitfaden</span>
            <span>·</span>
            <span>Substanz statt Look</span>
          </div>

          <h1 className='text-2xl sm:text-3xl md:text-4xl font-serif tracking-tight text-foreground'>
            Hinsehen, solange es da ist.
          </h1>
          <p className='text-base sm:text-lg font-serif italic text-muted-foreground'>
            Zeigen, was ich festhalten konnte.
          </p>
        </div>

        {/* Progress indicator & Reset control */}
        <div className='mt-6 pt-4 border-t border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono'>
          <div className='flex items-center gap-2.5'>
            <div className='w-24 sm:w-32 h-1.5 bg-muted rounded-full overflow-hidden'>
              <div
                className='h-full bg-primary transition-all duration-300 rounded-full'
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className='text-foreground font-medium'>
              {checkedCount} / {totalItems} abgehakt
            </span>
            {checkedCount === totalItems && isMounted && (
              <span className='text-[10px] uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-sm inline-flex items-center gap-1'>
                <IconSparkles className='size-3' />
                Komplett
              </span>
            )}
          </div>

          {checkedCount > 0 && isMounted && (
            <Button
              variant='ghost'
              size='sm'
              onClick={handleReset}
              className='h-7 text-xs font-mono text-muted-foreground hover:text-foreground self-start sm:self-auto gap-1.5 px-2'
            >
              <IconRotate className='size-3' />
              <span>Zurücksetzen</span>
            </Button>
          )}
        </div>
      </div>

      {/* Sections */}
      <div className='space-y-6 sm:space-y-8'>
        {CHECKLIST_SECTIONS.map((section) => {
          const SectionIcon = section.icon;
          const sectionCheckedCount = section.items.filter(
            (item) => checkedIds[item.id],
          ).length;
          const isSectionComplete =
            sectionCheckedCount === section.items.length && isMounted;

          return (
            <div key={section.id} className='space-y-3'>
              {/* Section Header */}
              <div className='flex items-baseline justify-between gap-2 border-b border-border/40 pb-2 px-1'>
                <div className='space-y-0.5'>
                  <div className='flex items-center gap-2'>
                    <span className='text-[11px] font-mono tracking-widest text-primary font-bold uppercase'>
                      {section.phaseNumber} · {section.title}
                    </span>
                    {isSectionComplete && (
                      <span className='text-[10px] font-mono uppercase bg-primary/10 text-primary px-1.5 py-0.2 rounded-xs font-semibold'>
                        Erledigt
                      </span>
                    )}
                  </div>
                  <h2 className='text-sm sm:text-base font-serif italic text-muted-foreground'>
                    {section.subtitle}
                  </h2>
                </div>

                <span className='text-[11px] font-mono text-muted-foreground shrink-0'>
                  {sectionCheckedCount} / {section.items.length}
                </span>
              </div>

              {/* Items List */}
              <div className='grid grid-cols-1 gap-2 sm:gap-2.5'>
                {section.items.map((item) => {
                  const isChecked = Boolean(isMounted && checkedIds[item.id]);

                  return (
                    <Card
                      key={item.id}
                      onClick={() => toggleItem(item.id)}
                      className={cn(
                        'cursor-pointer select-none transition-all duration-200 border-border/60 hover:border-primary/40 active:scale-[0.99] p-3.5 sm:p-4 rounded-lg',
                        isChecked
                          ? 'bg-muted/40 border-border/30 opacity-75'
                          : 'bg-card hover:bg-accent/30 shadow-2xs',
                      )}
                    >
                      <CardContent className='p-0 flex items-start gap-3 sm:gap-3.5'>
                        <div className='pt-0.5 shrink-0'>
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() => toggleItem(item.id)}
                            aria-label={item.title}
                            className='size-4 sm:size-4.5 rounded-[4px]'
                          />
                        </div>

                        <div className='space-y-1 min-w-0 flex-1'>
                          <h3
                            className={cn(
                              'text-sm sm:text-base font-medium leading-snug transition-colors',
                              isChecked
                                ? 'line-through text-muted-foreground decoration-muted-foreground/40'
                                : 'text-foreground',
                            )}
                          >
                            {item.title}
                          </h3>
                          <p
                            className={cn(
                              'text-xs sm:text-sm leading-relaxed transition-colors',
                              isChecked
                                ? 'text-muted-foreground/60 line-through decoration-muted-foreground/30'
                                : 'text-muted-foreground',
                            )}
                          >
                            {item.description}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Closing Grounding Mantra */}
      <div className='pt-6 sm:pt-8 pb-4 text-center'>
        <div className='inline-block rounded-full bg-muted/40 border border-border/50 px-5 py-2.5'>
          <p className='text-xs sm:text-sm font-serif italic text-foreground/90'>
            „Nichts bleibt, wie es ist. Also: hinsehen.“
          </p>
        </div>
      </div>
    </div>
  );
}
