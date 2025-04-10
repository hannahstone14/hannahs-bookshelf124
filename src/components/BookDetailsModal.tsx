import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Book } from '@/types/book';
import { CalendarIcon, BookOpenText, Pencil, Star, Heart } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useBookshelf } from '@/context/BookshelfContext';
import { cn } from '@/lib/utils';

interface BookDetailsModalProps {
  book: Book | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
}

const BookDetailsModal: React.FC<BookDetailsModalProps> = ({
  book,
  isOpen,
  onClose,
  onEdit
}) => {
  const { toggleFavorite } = useBookshelf();

  if (!book) return null;

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'Unknown';
    try {
      return format(new Date(date), 'MMMM d, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const handleToggleFavorite = () => {
    if (book) {
      toggleFavorite(book.id);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">{book.title}</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col md:flex-row gap-4 mt-2">
          {/* Book Cover */}
          <div className="w-full md:w-1/3 flex justify-center relative">
            {book.coverUrl ? (
              <img 
                src={book.coverUrl} 
                alt={book.title} 
                className="h-60 w-40 object-cover rounded-md shadow-md"
              />
            ) : (
              <div 
                className="h-60 w-40 flex items-center justify-center rounded-md shadow-md"
                style={{ backgroundColor: book.color || '#3B82F6' }}
              >
                <span className="text-white text-lg font-bold">{book.title.substring(0, 2)}</span>
              </div>
            )}
            {/* Favorite Icon on Cover */}
            {book.favorite && (
              <div className="absolute top-2 right-2 bg-white p-1 rounded-full shadow-md">
                <Heart className="h-4 w-4 text-red-500 fill-red-500" />
              </div>
            )}
          </div>
          
          {/* Book Details */}
          <div className="w-full md:w-2/3 space-y-3">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Author</h3>
              <p>{book.author}</p>
            </div>
            
            {book.status && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Status</h3>
                <Badge 
                  className={cn(
                    book.status === 'read' ? 'bg-green-100 text-green-800 hover:bg-green-200' :
                    book.status === 'reading' ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' :
                    book.status === 'to-read' ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' :
                    'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  )}
                >
                  {book.status.replace('-', ' ')}
                </Badge>
              </div>
            )}
            
            {book.status === 'reading' && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Progress</h3>
                <div className="flex items-center gap-2">
                  <Progress value={book.progress} className="h-2 flex-grow" />
                  <span className="text-sm">{book.progress}%</span>
                </div>
              </div>
            )}
            
            {book.dateRead && book.status === 'read' && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Date Read</h3>
                <div className="flex items-center gap-1 text-sm">
                  <CalendarIcon className="h-4 w-4 text-gray-400" />
                  <span>{formatDate(book.dateRead)}</span>
                </div>
              </div>
            )}
            
            {book.pages && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Pages</h3>
                <div className="flex items-center gap-1 text-sm">
                  <BookOpenText className="h-4 w-4 text-gray-400" />
                  <span>{book.pages} pages</span>
                </div>
              </div>
            )}
            
            {book.genres && book.genres.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Genres</h3>
                <div className="flex flex-wrap gap-1 mt-1">
                  {book.genres.map(genre => (
                    <Badge key={genre} variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
                      {genre}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {book.recommendedBy && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Recommended By</h3>
                <p className="text-sm">{book.recommendedBy}</p>
              </div>
            )}
            
            {book.isSeries && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Series</h3>
                <p className="text-sm">
                  {book.seriesName || 'Unnamed Series'}
                  {book.seriesPosition && ` (#${book.seriesPosition})`}
                </p>
              </div>
            )}
            
            {book.tags && book.tags.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Tags</h3>
                <div className="flex flex-wrap gap-1 mt-1">
                  {book.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="bg-gray-100 text-gray-700">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter className="sm:justify-between mt-4">
          {/* Favorite Toggle Button */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleToggleFavorite} 
            className="flex items-center gap-1 text-gray-600 hover:text-red-500"
          >
            <Heart className={cn("h-4 w-4", book.favorite && "fill-red-500 text-red-500")} />
            {book.favorite ? 'Favorited' : 'Favorite'}
          </Button>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button 
              variant="default" 
              onClick={onEdit}
              className="flex items-center gap-1"
            >
              <Pencil className="h-4 w-4" /> 
              Edit
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BookDetailsModal; 