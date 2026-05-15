import { CollectionForm } from '@/modules/collections/ui/components/collection-form';

export const metadata = {
  title: 'New Collection',
};

const page = () => {
  return (
    <div className='py-4 px-4 md:px-8'>
      <h1 className='text-2xl font-bold mb-6'>New Collection</h1>
      <CollectionForm />
    </div>
  );
};

export default page;
