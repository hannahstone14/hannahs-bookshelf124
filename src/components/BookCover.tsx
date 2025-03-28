
import React, { useState } from 'react';
import { Book } from '@/types/book';
import { 
  Card, 
  CardContent 
} from '@/components/ui/card';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useBookshelf } from '@/context/BookshelfContext';
import { MoreVertical, Trash, Edit, Calendar, BookOpen, Star, StarOff } from 'lucide-react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import AddBookForm from './AddBookForm';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface BookCoverProps {
  book: Book;
  showStatus?: boolean;
}

// Genre color mapping
const genreColors: Record<string, { bg: string, text: string }> = {
  'Fiction': { bg: 'bg-blue-100', text: 'text-blue-700' },
  'Non-Fiction': { bg: 'bg-green-100', text: 'text-green-700' },
  'Science Fiction': { bg: 'bg-purple-100', text: 'text-purple-700' },
  'Fantasy': { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  'Mystery': { bg: 'bg-red-100', text: 'text-red-700' },
  'Biography': { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  'History': { bg: 'bg-orange-100', text: 'text-orange-700' },
  'Romance': { bg: 'bg-pink-100', text: 'text-pink-700' },
  'Self-Help': { bg: 'bg-teal-100', text: 'text-teal-700' },
  'Poetry': { bg: 'bg-gray-100', text: 'text-gray-700' },
  'Thriller': { bg: 'bg-red-100', text: 'text-red-700' },
  'Horror': { bg: 'bg-gray-800', text: 'text-gray-100' },
  'Adventure': { bg: 'bg-orange-100', text: 'text-orange-700' },
  'Young Adult': { bg: 'bg-cyan-100', text: 'text-cyan-700' },
  'Children': { bg: 'bg-lime-100', text: 'text-lime-700' },
  'Memoir': { bg: 'bg-amber-100', text: 'text-amber-700' },
  'Philosophy': { bg: 'bg-violet-100', text: 'text-violet-700' },
  'Psychology': { bg: 'bg-fuchsia-100', text: 'text-fuchsia-700' },
  'Science': { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  'Art': { bg: 'bg-rose-100', text: 'text-rose-700' },
};

// Status color mapping
const statusColors: Record<string, string> = {
  'read': '#10B981', // Green
  'reading': '#3B82F6', // Blue
  'to-read': '#F59E0B', // Yellow/Orange
};

const BookCover: React.FC<BookCoverProps> = ({ book, showStatus = false }) => {
  const { removeBook, updateProgress, toggleFavorite } = useBookshelf();
  const [showEdit, setShowEdit] = useState(false);
  
  // Use the persistent color from the book object
  const bookColor = book.color || '#3B82F6';

  // Get reading progress
  const readingProgress = book.progress || 0;

  // Get primary genre for badge
  const primaryGenre = book.genres && book.genres.length > 0 ? book.genres[0] : null;
  const genreStyle = primaryGenre && genreColors[primaryGenre] 
    ? genreColors[primaryGenre]
    : { bg: 'bg-gray-100', text: 'text-gray-700' };

  // Get status color
  const statusColor = statusColors[book.status] || '#8A898C';

  // Show progress bar for reading books
  const showProgressBar = book.status === 'reading';
  // Show status indicator for all books when showStatus is true
  const showStatusIndicator = showStatus;

  // Handle favorite toggle with prevention of event propagation
  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(book.id);
  };
  
  // Handle edit click with prevention of event propagation
  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowEdit(true);
  };

  // Handle remove with prevention of event propagation
  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeBook(book.id);
  };

  return (
    <div className="relative group transition-all">
      <Card className="book-cover shadow-xl h-64 w-44 transition-all duration-300 transform hover:translate-y-[-8px] flex flex-col overflow-hidden rounded-md drop-shadow-xl">
        <CardContent className="p-0 h-full flex flex-col">
          {book.coverUrl ? (
            <div 
              className="w-full h-full bg-cover bg-center flex-grow"
              style={{ backgroundImage: `url(${book.coverUrl})` }}
            >
              {/* Favorite indicator for books with cover images */}
              {book.favorite && (
                <div className="absolute bottom-2 left-2 z-10">
                  <Badge variant="outline" className="bg-yellow-400 border-0 p-1">
                    <Star className="h-4 w-4 text-white fill-white" />
                  </Badge>
                </div>
              )}
              
              {/* Status indicator when showStatus is true */}
              {showStatusIndicator && (
                <div 
                  className="absolute top-2 right-2 w-3 h-3 rounded-full"
                  style={{ backgroundColor: statusColor }}
                />
              )}
            </div>
          ) : (
            <div 
              className="w-full h-full flex items-center justify-center flex-grow p-4 relative"
              style={{ backgroundColor: bookColor }}
            >
              <div className="text-white font-sans text-center">
                <p className="font-bold text-lg line-clamp-3">{book.title}</p>
                <p className="text-sm mt-2 opacity-80">{book.author}</p>
              </div>

              {/* Status indicator when showStatus is true */}
              {showStatusIndicator && (
                <div 
                  className="absolute top-2 right-2 w-3 h-3 rounded-full"
                  style={{ backgroundColor: statusColor }}
                />
              )}
              
              {/* Favorite indicator for books without cover */}
              {book.favorite && (
                <div className="absolute bottom-2 left-2 z-10">
                  <Badge variant="outline" className="bg-yellow-400 border-0 p-1">
                    <Star className="h-4 w-4 text-white fill-white" />
                  </Badge>
                </div>
              )}
            </div>
          )}

          {/* Progress indicator for reading books */}
          {showProgressBar && (
            <div className="px-2 py-1 bg-white">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium">Progress</span>
                <span>{readingProgress}%</span>
              </div>
              <Progress value={readingProgress} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Primary genre badge */}
      {primaryGenre && (
        <div className="absolute top-2 left-2">
          <Badge variant="outline" className={`${genreStyle.bg} ${genreStyle.text} border-0 text-xs`}>
            {primaryGenre}
          </Badge>
        </div>
      )}
      
      {/* Dialog for editing - always mounted but shown/hidden with the open prop */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogTitle>Edit Book</DialogTitle>
          <AddBookForm bookToEdit={book} onSuccess={() => setShowEdit(false)} />
        </DialogContent>
      </Dialog>

      {/* Options menu - fixed position at top right, with improved visibility */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-30">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="icon" 
              className="h-7 w-7 bg-white shadow-md"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-white z-50 w-48 shadow-lg">
            <DropdownMenuItem onSelect={handleEditClick}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem 
              className={book.favorite ? "text-yellow-500" : "text-gray-600"}
              onSelect={handleFavoriteToggle}
            >
              {book.favorite ? (
                <>
                  <StarOff className="h-4 w-4 mr-2" />
                  Remove Favorite
                </>
              ) : (
                <>
                  <Star className="h-4 w-4 mr-2" />
                  Mark as Favorite
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem className="text-gray-500">
              <Calendar className="h-4 w-4 mr-2" />
              Read: {format(book.dateRead instanceof Date ? book.dateRead : new Date(), 'MMM d, yyyy')}
            </DropdownMenuItem>
            {book.status === 'reading' && (
              <DropdownMenuItem className="text-blue-700">
                <BookOpen className="h-4 w-4 mr-2" />
                Currently Reading
              </DropdownMenuItem>
            )}
            <DropdownMenuItem 
              className="text-destructive focus:text-destructive"
              onSelect={handleRemoveClick}
            >
              <Trash className="h-4 w-4 mr-2" />
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default BookCover;
