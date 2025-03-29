
import React from 'react';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

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
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16 border-2 border-white shadow-md">
          <AvatarImage 
            src="/lovable-uploads/47602fcc-f8fb-42c1-ab12-804de5049f44.png" 
            alt="Hannah's profile" 
          />
          <AvatarFallback>HL</AvatarFallback>
        </Avatar>
        <h1 className="text-3xl font-medium">Hannah's Library</h1>
      </div>
      
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
