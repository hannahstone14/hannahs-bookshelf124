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
import { cn } from '@/lib/utils';

interface BookshelfGridProps {
  books: Book[];
  onEdit: (book: Book) => void;
  onDelete: (bookId: string) => void;
  onShowDetails: (book: Book) => void;
  onDragStart?: (book: Book) => void;
  onDragOver?: (e: React.DragEvent<HTMLDivElement>, book: Book) => void;
  onDrop?: (e: React.DragEvent<HTMLDivElement>, book: Book) => void;
  draggedOverBook?: Book | null;
  showStatus?: boolean;
  cardClassName?: string;
}

const BookshelfGrid: React.FC<BookshelfGridProps> = ({ 
  books, 
  onEdit, 
  onDelete,
  onShowDetails,
  onDragStart,
  onDragOver,
  onDrop,
  draggedOverBook,
  showStatus = false,
  cardClassName
}) => {
  if (books.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-md">
        <p className="text-gray-500">No books to display</p>
      </div>
    );
  }

  return (
    <div className={cn(
      "bg-white border border-gray-200 rounded-lg shadow-sm p-4 sm:p-6 relative",
      cardClassName
    )}>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-6">
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
              onClick={() => onShowDetails(book)}
              className={`${onDragStart ? 'cursor-move' : ''} book-container relative group ${draggedOverBook?.id === book.id ? 'opacity-50' : ''}`}
            >
              <div className="absolute right-1 top-1 z-50 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="h-6 w-6 sm:h-7 sm:w-7 bg-white">
                      <MoreVertical className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40 sm:w-48 bg-white z-50">
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
                <BookCover 
                  book={book} 
                  showStatus={showStatus} 
                  showProgress={true} 
                  showControls={false}
                />
                
                {book.isSeries && (
                  <Badge className="absolute top-2 left-2 bg-purple-600 text-white text-[10px] sm:text-xs px-1 py-0 sm:px-1.5 sm:py-0.5">Series</Badge>
                )}
              </div>
              
              <div className="mt-1 text-center">
                <div className="text-xs sm:text-sm font-medium break-words max-w-full whitespace-normal line-clamp-2">
                  {displayTitle}
                </div>
                <div className="text-[10px] sm:text-xs text-gray-500 break-words max-w-full">
                  {book.author}
                </div>
                
                {book.recommendedBy && (
                  <div className="text-[10px] sm:text-xs text-center mt-1 text-blue-500 break-words max-w-full">
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
