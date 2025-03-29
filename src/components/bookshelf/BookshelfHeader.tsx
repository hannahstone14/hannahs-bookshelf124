
import React from 'react';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BookshelfHeaderProps {
  onAddBook: () => void;
  totalBooks?: number;
  totalCompleteSeries?: number;
}

const BookshelfHeader: React.FC<BookshelfHeaderProps> = ({ 
  onAddBook,
  totalBooks,
  totalCompleteSeries
}) => {
  return (
    <div className="mb-6">
      {totalBooks !== undefined && (
        <div className="flex mb-3">
          <span className="text-gray-500">
            {totalBooks} books
            {totalCompleteSeries !== undefined && totalCompleteSeries > 0 && (
              <span className="ml-1">• {totalCompleteSeries} complete series</span>
            )}
          </span>
        </div>
      )}
    </div>
  );
};

export default BookshelfHeader;
