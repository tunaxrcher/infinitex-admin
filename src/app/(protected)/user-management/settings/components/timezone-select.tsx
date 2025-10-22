'use client';

import { useState } from 'react';
import { Button, ButtonArrow } from '@src/shared/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@src/shared/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@src/shared/components/ui/popover';
import { ScrollArea } from '@src/shared/components/ui/scroll-area';
import { getTimeZones } from '@src/shared/i18n/timezones';
import { cn } from '@src/shared/lib/utils';
import { Check } from 'lucide-react';

const TimezoneSelect = ({
  defaultValue = '',
  onChange,
}: {
  defaultValue: string | undefined;
  onChange: (value: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<string>(defaultValue);
  const timeZoneList = getTimeZones();
  const selectedValue = value
    ? timeZoneList.find((timezone) => timezone.value === value)?.label
    : '';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          mode="input"
          placeholder={!value}
          aria-expanded={open}
          className="w-full"
        >
          <span className={cn('truncate')}>
            {selectedValue || 'Select a timezone'}
          </span>
          <ButtonArrow />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popper-anchor-width) p-0">
        <Command>
          <CommandInput placeholder="Search timezone..." />
          <CommandList>
            <ScrollArea viewportClassName="max-h-[300px] [&>div]:block!">
              <CommandEmpty>No timezone found.</CommandEmpty>
              <CommandGroup>
                {timeZoneList.map(({ value: itemValue, label }) => (
                  <CommandItem
                    key={itemValue}
                    value={itemValue}
                    onSelect={(currentValue) => {
                      onChange(currentValue === value ? '' : currentValue);
                      setValue(currentValue === value ? '' : currentValue);
                      setOpen(false);
                    }}
                  >
                    <span className="truncate">{label}</span>
                    {value === itemValue && (
                      <Check className={cn('size-4 ms-auto')} />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </ScrollArea>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default TimezoneSelect;
