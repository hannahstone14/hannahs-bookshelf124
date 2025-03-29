
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
}

const BookList: React.FC<BookListProps> = ({ books, onEdit, onDelete }) => {
  if (books.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-md">
        <p className="text-gray-500">No books to display</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="divide-y divide-gray-200">
        {books.map(book => {
          // Create a modified title that adds "Series" for series books
          const displayTitle = book.isSeries ? `${book.title} Series` : book.title;
          
          return (
            <div 
              key={book.id}
              className={cn(
                "flex items-center p-3 border-b border-gray-200 hover:bg-gray-50",
                book.isSeries && "bg-purple-50 hover:bg-purple-100"
              )}
            >
              <div className="w-12 h-16 mr-4 relative">
                {book.coverUrl ? (
                  <div 
                    className={cn(
                      "w-full h-full bg-cover bg-center rounded shadow-md",
                      book.isSeries && "border border-purple-400"
                    )}
                    style={{ backgroundImage: `url(${book.coverUrl})` }}
                  />
                ) : (
                  <div 
                    className={cn(
                      "w-full h-full flex items-center justify-center rounded shadow-md",
                      book.isSeries && "bg-purple-100 border border-purple-400"
                    )}
                    style={{ backgroundColor: book.isSeries ? '#F3EEFF' : (book.color || '#3B82F6') }}
                  >
                    <span className={cn(
                      "text-xs font-bold",
                      book.isSeries ? "text-purple-700" : "text-white"
                    )}>
                      {displayTitle.substring(0, 2)}
                    </span>
                  </div>
                )}
                {book.favorite && (
                  <div className="absolute -top-1 -right-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                  </div>
                )}
                {book.isSeries && (
                  <div className="absolute -top-1 -left-1">
                    <div className="bg-purple-600 text-white p-0.5 rounded-full">
                      <BookMarked className="h-3 w-3" />
                    </div>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-medium">{displayTitle}</h3>
                <p className="text-sm text-gray-500">{book.author}</p>
                {book.isSeries && book.seriesName && (
                  <div className="flex items-center mt-0.5">
                    <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300 flex items-center gap-1 px-2 py-0">
                      <BookMarked className="h-3 w-3" />
                      <span>{book.seriesName}</span>
                    </Badge>
                  </div>
                )}
                {book.pages && (
                  <p className="text-xs text-gray-400">{book.pages} pages</p>
                )}
                {book.genres && book.genres.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {book.genres.slice(0, 2).map(genre => (
                      <span key={genre} className="text-xs bg-blue-50 text-blue-600 rounded px-1.5 py-0.5">
                        {genre}
                      </span>
                    ))}
                    {book.genres.length > 2 && (
                      <span className="text-xs bg-gray-50 text-gray-600 rounded px-1.5 py-0.5">
                        +{book.genres.length - 2}
                      </span>
                    )}
                  </div>
                )}
                {book.recommendedBy && (
                  <p className="text-xs text-blue-500">Recommended by: {book.recommendedBy}</p>
                )}
              </div>
              {book.status === 'reading' && (
                <div className="ml-4 text-blue-700 text-sm font-medium">
                  {book.progress}% 
                </div>
              )}
              <div className="ml-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-white">
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
