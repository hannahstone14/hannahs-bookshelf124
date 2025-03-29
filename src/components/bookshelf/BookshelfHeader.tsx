
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, ArrowUpDown } from 'lucide-react';

interface BookshelfHeaderProps {
  onAddBook: () => void;
  onSort: (option?: any) => void;
  totalBooks?: number;
  totalCompleteSeries?: number;
}

const BookshelfHeader: React.FC<BookshelfHeaderProps> = ({ 
  onAddBook, 
  onSort, 
  totalBooks, 
  totalCompleteSeries 
}) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <div className="flex-1">
        {/* Removed "Your Books" heading as requested */}
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
