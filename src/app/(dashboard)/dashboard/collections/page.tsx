import { DashboardCollectionsView } from '@/modules/collections/ui/views/dashboard-collections-view';

export const metadata = {
  title: 'Collections',
  description: 'Manage all your collections',
};

const page = () => {
  return <DashboardCollectionsView />;
};

export default page;
