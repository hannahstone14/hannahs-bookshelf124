
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
    <div className="flex justify-end items-center mb-6">
      <div className="flex items-center gap-3">
        {totalBooks !== undefined && (
          <span className="text-gray-500 mr-2">
            {totalBooks} books
            {totalCompleteSeries !== undefined && totalCompleteSeries > 0 && (
              <span className="ml-1">• {totalCompleteSeries} complete series</span>
            )}
          </span>
        )}
        <Button 
          className="bg-blue-700 hover:bg-blue-800 text-lg px-8 py-6 h-auto"
          id="add-book-button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onAddBook();
          }}
        >
          <PlusCircle className="h-6 w-6 mr-2" />
          Add Book
        </Button>
      </div>
    </div>
  );
};

export default BookshelfHeader;
