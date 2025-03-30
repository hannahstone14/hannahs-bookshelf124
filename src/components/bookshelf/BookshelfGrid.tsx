
import React from 'react';
import { MoreVertical, Pencil, Trash2, BookMarked, BookOpenCheck } from 'lucide-react';
import { Book } from '@/types/book';
import BookCover from '@/components/BookCover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu';

interface BookshelfGridProps {
  books: Book[];
  onEdit: (book: Book) => void;
  onDelete: (bookId: string) => void;
  onDragStart?: (book: Book) => void;
  onDragOver?: (e: React.DragEvent<HTMLDivElement>, book: Book) => void;
  onDrop?: (e: React.DragEvent<HTMLDivElement>, book: Book) => void;
  draggedOverBook?: Book | null;
  showStatus?: boolean;
}

const BookshelfGrid: React.FC<BookshelfGridProps> = ({ 
  books, 
  onEdit, 
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  draggedOverBook,
  showStatus = false
}) => {
  if (books.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-md">
        <p className="text-gray-500">No books to display</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-blue-50 to-transparent rounded-md p-4 relative">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {books.map(book => {
          // Create a modified title that adds "Series" for series books
          const displayTitle = book.title;
          
          return (
            <div 
              key={book.id}
              draggable={!!onDragStart}
              onDragStart={() => onDragStart?.(book)}
              onDragOver={(e) => onDragOver?.(e, book)}
              onDrop={(e) => onDrop?.(e, book)}
              className={`${onDragStart ? 'cursor-move' : ''} book-container relative group ${draggedOverBook?.id === book.id ? 'opacity-50' : ''}`}
            >
              <div className="absolute right-1 top-1 z-50 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="h-7 w-7 bg-white">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-white z-50">
                    <DropdownMenuItem onClick={() => onEdit(book)}>
                      <Pencil className="h-4 w-4 mr-2" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDelete(book.id)}>
                      <Trash2 className="h-4 w-4 mr-2" /> Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className="relative">
                <BookCover book={book} showStatus={showStatus} />
                
                {book.isSeries && (
                  <Badge className="absolute top-2 left-2 bg-purple-600 text-white text-xs">Series</Badge>
                )}
                
                {/* Removed duplicate reading badge that was here */}
              </div>
              
              <div className="mt-1 text-center">
                <div className="text-sm font-medium break-words max-w-full whitespace-normal">
                  {displayTitle}
                </div>
                <div className="text-xs text-gray-500 break-words max-w-full">
                  {book.author}
                </div>
                
                {book.recommendedBy && (
                  <div className="text-xs text-center mt-1 text-blue-500 break-words max-w-full">
                    From: {book.recommendedBy}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BookshelfGrid;
