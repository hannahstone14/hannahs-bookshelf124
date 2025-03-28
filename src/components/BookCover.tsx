
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
import { MoreVertical, Trash, Edit, Calendar, BookOpen } from 'lucide-react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import AddBookForm from './AddBookForm';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface BookCoverProps {
  book: Book;
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
};

// Status color mapping
const statusColors: Record<string, string> = {
  'read': '#10B981', // Green
  'reading': '#3B82F6', // Blue
  'to-read': '#F59E0B', // Yellow/Orange
};

const BookCover: React.FC<BookCoverProps> = ({ book }) => {
  const { removeBook, updateProgress } = useBookshelf();
  const [showEdit, setShowEdit] = useState(false);
  
  // Generate random color if not provided
  const bookColor = book.color || 
    ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'][
      Math.floor(Math.random() * 6)
    ];

  // Get reading progress
  const readingProgress = book.progress || 0;

  // Get genre color or default
  const genreStyle = book.genre && genreColors[book.genre] 
    ? genreColors[book.genre]
    : { bg: 'bg-gray-100', text: 'text-gray-700' };

  // Get status color
  const statusColor = statusColors[book.status] || '#8A898C';

  return (
    <div className="relative group transition-all">
      <Card className="shadow-lg h-64 w-44 transition-all duration-300 transform hover:translate-y-[-8px] flex flex-col overflow-hidden rounded-md drop-shadow-xl">
        <CardContent className="p-0 h-full flex flex-col">
          {book.coverUrl ? (
            <div 
              className="w-full h-full bg-cover bg-center flex-grow"
              style={{ backgroundImage: `url(${book.coverUrl})` }}
            />
          ) : (
            <div 
              className="w-full h-full flex items-center justify-center flex-grow p-4 relative"
              style={{ backgroundColor: bookColor }}
            >
              <div className="text-white font-sans text-center">
                <p className="font-bold text-lg line-clamp-3">{book.title}</p>
                <p className="text-sm mt-2 opacity-80">{book.author}</p>
              </div>

              {/* Status indicator dot - top right corner */}
              <div 
                className="absolute top-2 right-2 w-3 h-3 rounded-full"
                style={{ backgroundColor: statusColor }}
              />
            </div>
          )}

          {/* Reading progress bar - always show for reading and partially read books */}
          {book.status === 'reading' || (book.progress > 0 && book.progress < 100) && (
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

      {/* Genre badge */}
      {book.genre && (
        <div className="absolute top-2 left-2">
          <Badge variant="outline" className={`${genreStyle.bg} ${genreStyle.text} border-0 text-xs`}>
            {book.genre}
          </Badge>
        </div>
      )}
      
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger className="p-1 bg-white/80 rounded-full shadow-md">
            <MoreVertical className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <Dialog open={showEdit} onOpenChange={setShowEdit}>
              <DialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <AddBookForm bookToEdit={book} onSuccess={() => setShowEdit(false)} />
              </DialogContent>
            </Dialog>
            <DropdownMenuItem className="text-gray-500">
              <Calendar className="h-4 w-4 mr-2" />
              Read: {format(book.dateRead, 'MMM d, yyyy')}
            </DropdownMenuItem>
            {book.status === 'reading' && (
              <DropdownMenuItem className="text-blue-500">
                <BookOpen className="h-4 w-4 mr-2" />
                Currently Reading
              </DropdownMenuItem>
            )}
            <DropdownMenuItem 
              className="text-destructive focus:text-destructive"
              onSelect={() => removeBook(book.id)}
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
