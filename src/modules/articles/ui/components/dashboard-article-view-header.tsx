import { Button } from '@/components/ui/button';

interface DashboardArticleViewHeaderProps {
  title: string;
  onRemove: () => void;
  onSave: () => void;
}

export const DashboardArticleViewHeader = ({
  title,
  onRemove,
  onSave,
}: DashboardArticleViewHeaderProps) => {
  return (
    <div className='flex items-center justify-between'>
      <h1 className='text-xl'>{title}</h1>
      <div className='flex gap-2'>
        <Button onClick={onRemove} variant='destructive'>
          Delete
        </Button>
        <Button onClick={onSave}>Save</Button>
      </div>
    </div>
  );
};
