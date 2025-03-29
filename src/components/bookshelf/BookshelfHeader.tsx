
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUpDown } from 'lucide-react';

interface BookshelfHeaderProps {
  onSort: (option?: any) => void;
  totalBooks?: number;
  totalCompleteSeries?: number;
}

const BookshelfHeader: React.FC<BookshelfHeaderProps> = ({ 
  onSort, 
  totalBooks, 
  totalCompleteSeries 
}) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <div className="flex-1">
        {/* Empty space (Your Books heading removed) */}
      </div>
      <div className="flex gap-2 items-center">
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => onSort()}
          className="h-9 w-9"
        >
          <ArrowUpDown className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default BookshelfHeader;
