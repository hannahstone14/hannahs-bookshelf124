
import React, { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { YearPicker } from '@/components/ui/year-picker';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';

interface DateReadPickerProps {
  date: Date | undefined;
  onDateChange: (date: Date) => void;
}

const DateReadPicker: React.FC<DateReadPickerProps> = ({ date, onDateChange }) => {
  const [selectedTab, setSelectedTab] = useState<'full-date' | 'year-only'>('full-date');
  
  // Create a default date if none is provided or if it's invalid
  const safeDate = date instanceof Date && !isNaN(date.getTime()) 
    ? date 
    : new Date();
  
  const handleYearChange = (year: number) => {
    const newDate = new Date(safeDate);
    newDate.setFullYear(year);
    onDateChange(newDate);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full pl-3 text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          {date instanceof Date && !isNaN(date.getTime()) ? (
            selectedTab === 'year-only' 
              ? format(date, "yyyy") 
              : format(date, "PPP")
          ) : (
            <span>Select date</span>
          )}
          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-white" align="start">
        <Tabs 
          defaultValue="full-date" 
          value={selectedTab} 
          onValueChange={(value) => setSelectedTab(value as 'full-date' | 'year-only')}
          className="w-full"
        >
          <div className="p-3 border-b">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="full-date">Full Date</TabsTrigger>
              <TabsTrigger value="year-only">Year Only</TabsTrigger>
            </TabsList>
          </div>
          
          <div className="min-h-[300px]">
            <TabsContent value="full-date" className="p-0 pointer-events-auto">
              <Calendar
                mode="single"
                selected={safeDate}
                onSelect={(newDate) => newDate && onDateChange(newDate)}
                initialFocus
                className="pointer-events-auto"
              />
            </TabsContent>
            
            <TabsContent value="year-only" className="p-3 pointer-events-auto">
              <div className="py-4">
                <YearPicker
                  value={safeDate.getFullYear()}
                  onChange={handleYearChange}
                  startYear={1900}
                  className="w-full pointer-events-auto"
                />
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
};

export default DateReadPicker;
