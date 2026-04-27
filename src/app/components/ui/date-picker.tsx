"use client";

import * as React from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "./utils";
import { Button } from "./button";
import { Calendar } from "./calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover";

interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pilih tanggal",
  className,
}: DatePickerProps) {
  const [date, setDate] = React.useState<Date | undefined>(value);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    setDate(value);
  }, [value]);

  const handleSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    onChange?.(selectedDate);
    if (selectedDate) {
      setOpen(false);
    }
  };

  const handleClear = () => {
    setDate(undefined);
    onChange?.(undefined);
    setOpen(false);
  };

  const handleToday = () => {
    const today = new Date();
    setDate(today);
    onChange?.(today);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "dd/MM/yyyy", { locale: id }) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          locale={id}
          initialFocus
        />
        <div className="flex items-center justify-between p-3 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="text-sm"
          >
            Hapus
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToday}
            className="text-sm"
          >
            Hari ini
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
