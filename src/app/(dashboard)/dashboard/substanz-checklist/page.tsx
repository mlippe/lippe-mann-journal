import { Metadata } from 'next';
import { SubstanzChecklistView } from '@/modules/dashboard/ui/views/substanz-checklist-view';

export const metadata: Metadata = {
  title: 'Substanz-Checkliste',
  description: 'Hinsehen, solange es da ist. Zeigen, was ich festhalten konnte.',
};

const SubstanzChecklistPage = () => {
  return (
    <div className='py-4 px-4 md:px-8 flex flex-col flex-1 pb-16'>
      <SubstanzChecklistView />
    </div>
  );
};

export default SubstanzChecklistPage;
