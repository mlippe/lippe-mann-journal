'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { useTRPC } from '@/trpc/client';
import { useQuery } from '@tanstack/react-query';

interface CollectionSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
}

export function CollectionSelect({ value, onChange }: CollectionSelectProps) {
  const [open, setOpen] = React.useState(false);
  const trpc = useTRPC();
  const { data: collections } = useQuery(
    trpc.collections.getAllCollections.queryOptions({}),
  );

  const selectedCollections = React.useMemo(() => {
    return collections?.filter((c) => value.includes(c.id)) || [];
  }, [collections, value]);

  const handleUnselect = (id: string) => {
    onChange(value.filter((v) => v !== id));
  };

  return (
    <div className='flex flex-col gap-2'>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant='outline'
            role='combobox'
            aria-expanded={open}
            className='w-full justify-between hover:bg-background'
          >
            <span className='truncate'>
              {value.length > 0
                ? `${value.length} collection(s) selected`
                : 'Select collections...'}
            </span>
            <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-full p-0' align='start'>
          <Command>
            <CommandInput placeholder='Search collections...' />
            <CommandList>
              <CommandEmpty>No collection found.</CommandEmpty>
              <CommandGroup>
                {collections?.map((collection) => (
                  <CommandItem
                    key={collection.id}
                    value={collection.name}
                    onSelect={() => {
                      const newValue = value.includes(collection.id)
                        ? value.filter((v) => v !== collection.id)
                        : [...value, collection.id];
                      onChange(newValue);
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value.includes(collection.id)
                          ? 'opacity-100'
                          : 'opacity-0',
                      )}
                    />
                    {collection.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <div className='flex flex-wrap gap-1'>
        {selectedCollections.map((collection) => (
          <Badge key={collection.id} variant='secondary' className='gap-1'>
            {collection.name}
            <button
              className='ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleUnselect(collection.id);
                }
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={() => handleUnselect(collection.id)}
            >
              <X className='h-3 w-3 text-muted-foreground hover:text-foreground' />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
}
