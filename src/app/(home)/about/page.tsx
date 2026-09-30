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
          <div className='flex flex-col p-7 lg:p-12 gap-10'>
            <h1 className='text-3xl'>Hallo! Moin! Servus! Grüzi!</h1>
            <div className='flex flex-col gap-4 font-light'>
              <p className='md:text-lg'>
                Das hier ist mein Journal:{' '}
                <b>
                  eine visuelle Chronik aus Fragmenten, Begegnungen und Momenten
                  des Alltags.
                </b>{' '}
                Vor allem in Bildern, manchmal mit einem Gedanken dazu.
              </p>
            </div>
          </div>
        </CardContainer>

        <CardContainer>
          <div className='flex flex-col p-7 lg:p-12 gap-5'>
            <h2 className='text-xl md:text-2xl'>Wer bin ich?</h2>
            <div className='flex flex-col gap-4 font-light'>
              <p className='md:text-lg'>
                Ich heiße Manuel Lippmann und bin Vieles: digitaler
                Produktdesigner, Frontend Entwickler, FPV Drohnenpilot, Fotograf
                und Videograf. Zur Zeit lebe in München.
              </p>

              <Link
                href='https://lippe-mann.de/about'
                target='_blank'
                className='underline hover:no-underline'
              >
                Mehr & Kontakt
              </Link>
            </div>
          </div>
        </CardContainer>

        <CardContainer>
          <div className='flex flex-col p-7 lg:p-12 gap-5'>
            <h2 className='text-xl md:text-2xl'>Warum dieses Journal?</h2>
            <div className='flex flex-col gap-4 font-light'>
              <p className='md:text-lg'>
                Vor Kurzem (Jan &apos;26) stieß ich auf das wunderbare Buch{' '}
                <Link
                  href='https://austinkleon.com/show-your-work/'
                  target='_blank'
                  className='underline hover:no-underline'
                >
                  Show your work von Austin Kleon
                </Link>
                . Darin geht es darum, das kreative Menschen mehr von der
                eigenen Arbeit zeigen sollen. Nicht die fertigen Ergebnisse,
                sondern den Prozess, Ausschnitte, Gedanken.
              </p>
              <p className='md:text-lg'>
                Genau das tue ich hier, nur dass es bei mir hauptsächlich Bilder
                geworden sind:
                <br />
                <br />
                Ich fotografiere, was mir im Alltag auffällt: das Licht an einer
                Hauswand, eine Farbe, die plötzlich zusammenpasst, ein Moment,
                der ohne Kamera einfach vorbeigegangen wäre. Ich bin dankbar für
                die kleinen schönen Dinge, und nichts bleibt, wie es ist. Also
                halte ich sie fest, solange sie da sind, und zeige, wie ich die
                Welt sehe und wo ich Schönheit finde.
                <br />
                <br />
              </p>
            </div>
          </div>
        </CardContainer>

        <CardContainer>
          <div className='flex flex-col p-7 lg:p-12 gap-5'>
            <h2 className='text-xl md:text-2xl'>Und das Ganze in konkret?</h2>
            <div className='flex flex-col gap-6 font-light'>
              <p className='md:text-lg'>
                Folgende Themen sind in diesem Journal zu finden:
              </p>
              <p className='md:text-lg'>
                <b className='font-medium '>
                  Fotoserien aus dem Alltag, oft mit ein paar Sätzen dazu
                </b>
              </p>
              <p className='md:text-lg'>
                <b className='font-medium '>
                  Gelegentlich Gedanken und Einblicke
                </b>{' '}
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
