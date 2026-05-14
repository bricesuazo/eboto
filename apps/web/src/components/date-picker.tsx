import { useState } from 'react';
import dayjs from 'dayjs';
import { CalendarIcon } from 'lucide-react';

import { Button } from '~/components/ui/button';
import { Calendar } from '~/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover';
import { cn } from '~/lib/utils';

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  disabledBefore: Date;
  disabled?: boolean;
  className?: string;
  id?: string;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
}

export function DatePicker({
  value,
  onChange,
  disabledBefore,
  disabled,
  className,
  id,
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedBy,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = value ? dayjs(value).toDate() : undefined;
  const beforeDay = dayjs(disabledBefore).startOf('day').toDate();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            id={id}
            disabled={disabled}
            aria-invalid={ariaInvalid}
            aria-describedby={ariaDescribedBy}
            className={cn(
              'w-full justify-between font-normal',
              !value && 'text-muted-foreground',
              className,
            )}
          >
            {selected ? dayjs(selected).format('MMM D, YYYY') : 'Pick a date'}
            <CalendarIcon className="size-4 opacity-50" />
          </Button>
        }
      />
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => {
            if (!date) return;
            onChange(dayjs(date).format('YYYY-MM-DD'));
            setOpen(false);
          }}
          disabled={{ before: beforeDay }}
          defaultMonth={selected ?? beforeDay}
        />
      </PopoverContent>
    </Popover>
  );
}
