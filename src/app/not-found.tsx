import Header from '@/modules/home/ui/components/header';
import { NotFoundView } from '@/components/not-found-view';

export default function GlobalNotFound() {
  return (
    <>
      <Header />
      <main className='min-h-screen p-3 md:p-6 pb-24'>
        <NotFoundView />
      </main>
    </>
  );
}
