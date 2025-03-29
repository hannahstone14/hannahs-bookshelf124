
import React from 'react';
import { PlusCircle, BookMarked } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BookshelfHeaderProps {
  onAddBook: () => void;
  totalBooks?: number;
  totalSeries?: number;
  onFilterSeries?: () => void;
  isFilteringSeries?: boolean;
}

const BookshelfHeader: React.FC<BookshelfHeaderProps> = ({ 
  onAddBook,
  totalBooks,
  totalSeries,
  onFilterSeries,
  isFilteringSeries
}) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-3xl font-medium">Hannah's Library</h1>
      
      <div className="flex items-center gap-3">
        {totalSeries && totalSeries > 0 && onFilterSeries && (
          <Button
            variant={isFilteringSeries ? "default" : "outline"}
            className={isFilteringSeries ? "bg-purple-700 hover:bg-purple-800" : "text-purple-700 border-purple-200 hover:bg-purple-50"}
            onClick={onFilterSeries}
          >
            <BookMarked className="h-5 w-5 mr-2" />
            Series ({totalSeries})
          </Button>
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
