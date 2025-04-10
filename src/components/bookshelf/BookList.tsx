import React from 'react';
import { Star, MoreVertical, Pencil, Trash2, BookMarked } from 'lucide-react';
import { Book } from '@/types/book';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu';

interface BookListProps {
  books: Book[];
  onEdit: (book: Book) => void;
  onDelete: (bookId: string) => void;
  onShowDetails: (book: Book) => void;
  cardClassName?: string;
}

const BookList: React.FC<BookListProps> = ({ books, onEdit, onDelete, onShowDetails, cardClassName }) => {
  if (books.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-md">
        <p className="text-gray-600">No books to display</p>
      </div>
    );
  }

  return (
    <div className={cn(
      "bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden",
      cardClassName
    )}>
      <div className="divide-y divide-gray-200">
        {books.map(book => {
          // Create a modified title that adds "Series" for series books
          const displayTitle = book.isSeries ? `${book.title} Series` : book.title;
          
          return (
            <div 
              key={book.id}
              onClick={() => onShowDetails(book)}
              className={cn(
                "flex items-center p-2 sm:p-3 border-b border-gray-200 hover:bg-gray-50",
                book.isSeries && "bg-purple-50 hover:bg-purple-100"
              )}
            >
              <div className="w-10 h-14 sm:w-12 sm:h-16 mr-3 sm:mr-4 relative">
                {book.coverUrl ? (
                  <div 
                    className="w-full h-full bg-cover bg-center rounded shadow-md"
                    style={{ backgroundImage: `url(${book.coverUrl})` }}
                  >
                    {book.isSeries && (
                      <div className="absolute top-0 left-0 bg-purple-700 text-white text-[8px] sm:text-xs px-1 rounded-tl rounded-br">
                        Series
                      </div>
                    )}
                  </div>
                ) : (
                  <div 
                    className="w-full h-full flex items-center justify-center rounded shadow-md relative"
                    style={{ backgroundColor: book.color || '#3B82F6' }}
                  >
                    <span className="text-[10px] sm:text-xs font-bold text-white">
                      {displayTitle.substring(0, 2)}
                    </span>
                    {book.isSeries && (
                      <div className="absolute top-0 left-0 bg-purple-700 text-white text-[8px] sm:text-xs px-1 rounded-tl rounded-br">
                        Series
                      </div>
                    )}
                  </div>
                )}
                {book.favorite && (
                  <div className="absolute -top-1 -right-1">
                    <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400 fill-yellow-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm sm:text-base font-medium line-clamp-1">{displayTitle}</h3>
                <p className="text-xs sm:text-sm text-gray-500 line-clamp-1">{book.author}</p>
                {book.pages && (
                  <p className="text-[10px] sm:text-xs text-gray-400">{book.pages} pages</p>
                )}
                {book.genres && book.genres.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {book.genres.slice(0, 1).map(genre => (
                      <span key={genre} className="text-[8px] sm:text-xs bg-blue-50 text-blue-600 rounded px-1 py-0 sm:py-0.5">
                        {genre}
                      </span>
                    ))}
                    {book.genres.length > 1 && (
                      <span className="text-[8px] sm:text-xs bg-gray-50 text-gray-600 rounded px-1 py-0 sm:py-0.5">
                        +{book.genres.length - 1}
                      </span>
                    )}
                  </div>
                )}
                {book.recommendedBy && (
                  <p className="text-[10px] sm:text-xs text-blue-500 truncate">From: {book.recommendedBy}</p>
                )}
              </div>
              {book.status === 'reading' && (
                <div className="ml-2 sm:ml-4 text-blue-700 text-xs sm:text-sm font-medium">
                  {book.progress}% 
                </div>
              )}
              <div className="ml-1 sm:ml-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 sm:h-8 sm:w-8">
                      <MoreVertical className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40 sm:w-48 bg-white">
                    <DropdownMenuItem onClick={() => onEdit(book)}>
                      <Pencil className="h-4 w-4 mr-2" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDelete(book.id)}>
                      <Trash2 className="h-4 w-4 mr-2" /> Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BookList;
