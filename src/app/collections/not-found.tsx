import { NotFoundView } from '@/components/not-found-view';

export default function CollectionsNotFound() {
  return (
    <NotFoundView
      title='Diese Sammlung wurde nicht gefunden.'
      description='Die angeforderte Sammlung existiert nicht oder wurde umbenannt.'
    />
  );
}
