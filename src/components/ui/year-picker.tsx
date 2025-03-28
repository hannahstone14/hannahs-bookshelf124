
import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface YearPickerProps {
  value: number;
  onChange: (year: number) => void;
  className?: string;
  startYear?: number;
  endYear?: number;
}

export function YearPicker({
  value,
  onChange,
  className,
  startYear = 1950,
  endYear = new Date().getFullYear(),
}: YearPickerProps) {
  const years = React.useMemo(() => {
    const yearsArray = [];
    for (let year = endYear; year >= startYear; year--) {
      yearsArray.push(year);
    }
    return yearsArray;
  }, [startYear, endYear]);

  return (
    <Select
      value={value.toString()}
      onValueChange={(value) => onChange(parseInt(value))}
    >
      <SelectTrigger 
        className={cn("w-full pointer-events-auto", className)}
      >
        <SelectValue placeholder="Select year" />
      </SelectTrigger>
      <SelectContent className="pointer-events-auto">
        {years.map((year) => (
          <SelectItem key={year} value={year.toString()} className="pointer-events-auto">
            {year}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
