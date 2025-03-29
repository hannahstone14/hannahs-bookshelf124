
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, ArrowUpDown } from 'lucide-react';

interface BookshelfHeaderProps {
  onAddBook: () => void;
  onSort: () => void;
}

const BookshelfHeader: React.FC<BookshelfHeaderProps> = ({ onAddBook, onSort }) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <div className="flex-1">
        <h2 className="text-2xl font-medium">Your Books</h2>
      </div>
      <div className="flex gap-2 items-center">
        <Button 
          variant="outline" 
          size="icon"
          onClick={onSort}
          className="h-9 w-9"
        >
          <ArrowUpDown className="h-4 w-4" />
        </Button>
        <Button 
          variant="default" 
          size="default" 
          onClick={onAddBook}
          className="px-6"
        >
          <Plus className="h-5 w-5 mr-2" /> Add Book
        </Button>
      </div>
    </div>
  );
};

export default BookshelfHeader;
