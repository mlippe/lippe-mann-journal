'use client';

export const PostsListHeader = () => {
  return (
    <div className='py-4 px-4 md:px-8 flex flex-col gap-y-8'>
      <div>
        <h1 className='text-2xl font-bold'>Beiträge</h1>
        <p className='text-muted-foreground '>
          Hier ist eine Übersicht all deiner Beiträge
        </p>
      </div>
    </div>
  );
};
