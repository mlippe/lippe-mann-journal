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
                In diesem Journal gibt es Einblicke in meine{' '}
                <b>
                  aktuellen Projekte, Gedankenfetzen zu Themen, die mich
                  beschäftigen
                </b>{' '}
                und <b>Bilder aus meinem täglichen Leben.</b>
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
                In diesem Journal tue ich genau das: eine Plattform für meine
                Arbeiten und Gedanken. Still mitlesen, liken, ignorieren oder
                mitdiskutieren.
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
                <b className='font-medium '>Persönliche Projekte</b>
                <br />
                Einzelheiten zu den Dingen, mit denen ich mir meine Freizeit und
                mein Leben vertreibe.
              </p>
              <p className='md:text-lg'>
                <b className='font-medium '>Fotos und Drohnenvideos</b>
                <br />
                Einst habe ich viel davon auf{' '}
                <Link
                  href='https://www.instagram.com/lippe.mann'
                  target='_blank'
                  className='underline hover:no-underline'
                >
                  meinem Instagram
                </Link>{' '}
                gepostet. Möchte ich nicht mehr. Ich möchte allerdings eine
                öffentliche Bühne für diese Inhalte.
              </p>
              <p className='md:text-lg'>
                <b className='font-medium '>
                  Gedanken zu Themen, die mich beschäftigen, die ich interessant
                  finde:
                </b>
                <br />
                <ul className='list-disc pl-6 my-4'>
                  <li className='mb-2'>
                    Entrepreneurship in der digitalen Welt
                  </li>
                  <li className='mb-2'>Lebensphilosophien und -entwürfe</li>
                  <li className='mb-2'>
                    <Link
                      href='https://de.wikipedia.org/wiki/Open_Source_Intelligence'
                      target='_blank'
                      className='underline hover:no-underline'
                    >
                      OSINT
                    </Link>
                  </li>
                  <li className='mb-2'>
                    <Link
                      href='https://meshtastic.org/docs/introduction'
                      target='_blank'
                      className='underline hover:no-underline'
                    >
                      Meshtastic - Alternative Kommunikationshardware
                    </Link>
                  </li>
                  <li>
                    Die Interaktion / Beziehung der Menschen mit Smartphones im
                    Alltag (Brainrot / Doomscrolling)
                  </li>
                </ul>
                Wie häufig was zu den Themen kommt, wird sich zeigen.
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
