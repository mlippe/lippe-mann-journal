// External dependencies
import { type Metadata } from 'next';

// Internal dependencies - UI Components
import Footer from '@/components/footer';
import CardContainer from '@/components/card-container';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About',
  description: 'About page',
};

const AboutPage = () => {
  return (
    <div className='mt-16 flex flex-col items-center gap-20'>
      <div className='flex flex-col gap-6 items-center max-w-3xl'>
        <CardContainer>
          <div className='flex flex-col p-6 sm:p-8 lg:p-12 gap-6 sm:gap-8'>
            <h1 className='text-2xl sm:text-3xl md:text-4xl font-medium tracking-tight md:tracking-[-0.03em] text-foreground leading-[1.12]'>
              Hallo! Moin! Servus! Grüzi!
            </h1>
            <div className='flex flex-col gap-4'>
              <p className='text-[15px] sm:text-base md:text-[17px] font-normal text-foreground/85 leading-[1.65] md:leading-[1.7]'>
                Das hier ist mein Journal:{' '}
                <strong className='font-medium text-foreground'>
                  eine visuelle Chronik aus Fragmenten, Begegnungen und Momenten
                  des Alltags.
                </strong>{' '}
                Vor allem in Bildern, manchmal mit einem Gedanken dazu.
              </p>
            </div>
          </div>
        </CardContainer>

        <CardContainer>
          <div className='flex flex-col p-6 sm:p-8 lg:p-12 gap-5'>
            <h2 className='text-lg sm:text-xl md:text-2xl font-medium tracking-tight text-foreground leading-[1.2]'>
              Wer bin ich?
            </h2>
            <div className='flex flex-col gap-4'>
              <p className='text-[15px] sm:text-base md:text-[17px] font-normal text-foreground/85 leading-[1.65] md:leading-[1.7]'>
                Ich heiße Manuel Lippmann und bin Vieles: digitaler
                Produktdesigner, Frontend Entwickler, FPV Drohnenpilot, Fotograf
                und Videograf. Zur Zeit lebe in München.
              </p>

              <Link
                href='https://lippe-mann.de/about'
                target='_blank'
                className='text-[14px] sm:text-[15px] text-foreground/90 font-medium underline decoration-border hover:decoration-foreground underline-offset-4 transition-colors w-fit'
              >
                Mehr & Kontakt
              </Link>
            </div>
          </div>
        </CardContainer>

        <CardContainer>
          <div className='flex flex-col p-6 sm:p-8 lg:p-12 gap-5'>
            <h2 className='text-lg sm:text-xl md:text-2xl font-medium tracking-tight text-foreground leading-[1.2]'>
              Warum dieses Journal?
            </h2>
            <div className='flex flex-col gap-4'>
              <p className='text-[15px] sm:text-base md:text-[17px] font-normal text-foreground/85 leading-[1.65] md:leading-[1.7]'>
                Vor Kurzem (Jan &apos;26) stieß ich auf das wunderbare Buch{' '}
                <Link
                  href='https://austinkleon.com/show-your-work/'
                  target='_blank'
                  className='underline decoration-border hover:decoration-foreground underline-offset-4 text-foreground transition-colors'
                >
                  Show your work von Austin Kleon
                </Link>
                . Darin geht es darum, dass kreative Menschen mehr von der
                eigenen Arbeit zeigen sollen. Nicht die fertigen Ergebnisse,
                sondern den Prozess, Ausschnitte, Gedanken.
              </p>
              <p className='text-[15px] sm:text-base md:text-[17px] font-normal text-foreground/85 leading-[1.65] md:leading-[1.7]'>
                Genau das tue ich hier, nur dass es bei mir hauptsächlich Bilder
                geworden sind:
              </p>
              <p className='text-[15px] sm:text-base md:text-[17px] font-normal text-foreground/85 leading-[1.65] md:leading-[1.7]'>
                Ich fotografiere, was mir im Alltag auffällt: das Licht an einer
                Hauswand, eine Farbe, die plötzlich zusammenpasst, ein Moment,
                der ohne Kamera einfach vorbeigegangen wäre. Ich bin dankbar für
                die kleinen schönen Dinge, und nichts bleibt, wie es ist. Also
                halte ich sie fest, solange sie da sind, und zeige, wie ich die
                Welt sehe und wo ich Schönheit finde.
              </p>
            </div>
          </div>
        </CardContainer>

        <CardContainer>
          <div className='flex flex-col p-6 sm:p-8 lg:p-12 gap-5'>
            <h2 className='text-lg sm:text-xl md:text-2xl font-medium tracking-tight text-foreground leading-[1.2]'>
              Und das Ganze in konkret?
            </h2>
            <div className='flex flex-col gap-4'>
              <p className='text-[15px] sm:text-base md:text-[17px] font-normal text-foreground/85 leading-[1.65] md:leading-[1.7]'>
                Folgende Themen sind in diesem Journal zu finden:
              </p>
              <p className='text-[15px] sm:text-base md:text-[17px] font-normal text-foreground/85 leading-[1.65] md:leading-[1.7]'>
                <strong className='font-medium text-foreground'>
                  Fotoserien aus dem Alltag, oft mit ein paar Sätzen dazu
                </strong>
              </p>
              <p className='text-[15px] sm:text-base md:text-[17px] font-normal text-foreground/85 leading-[1.65] md:leading-[1.7]'>
                <strong className='font-medium text-foreground'>
                  Gelegentlich Gedanken und Einblicke
                </strong>{' '}
                in Projekte, zum Beispiel zu Lebensphilosophien, Meshtastic oder
                dem Leben mit dem Smartphone
              </p>
            </div>
          </div>
        </CardContainer>
      </div>

      <div className='w-full'>
        <Footer />
      </div>
    </div>
  );
};

export default AboutPage;
