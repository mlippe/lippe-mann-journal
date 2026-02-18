import { Input } from '@/components/ui/input';
import { useArticlesFilters } from '../../hooks/use-articles-filters';
import { SearchIcon } from 'lucide-react';

export const ArticlesSearchFilter = () => {
  const [filters, setFilters] = useArticlesFilters();

  return (
    <div className='relative'>
      <Input
        placeholder='Filter by title'
        value={filters.search}
        className='h-9 w-50 pl-7'
        onChange={(e) => setFilters({ search: e.target.value })}
      />
      <SearchIcon className='size-4 absolute left-2 top-1/2 -translate-y-1/2' />
    </div>
  );
};
