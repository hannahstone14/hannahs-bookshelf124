
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
import { MoreVertical, Trash, Edit, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import AddBookForm from './AddBookForm';

interface BookCoverProps {
  book: Book;
}

const BookCover: React.FC<BookCoverProps> = ({ book }) => {
  const { removeBook } = useBookshelf();
  const [showEdit, setShowEdit] = useState(false);
  
  // Generate random color if not provided
  const bookColor = book.color || 
    ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'][
      Math.floor(Math.random() * 6)
    ];

  return (
    <div className="relative group animate-book-add">
      <Card className="book-shadow h-64 w-44 transition-all duration-300 transform group-hover:scale-105 flex flex-col overflow-hidden">
        <CardContent className="p-0 h-full flex flex-col">
          {book.coverUrl ? (
            <div 
              className="w-full h-full bg-cover bg-center flex-grow"
              style={{ backgroundImage: `url(${book.coverUrl})` }}
            />
          ) : (
            <div 
              className="w-full h-full flex items-center justify-center flex-grow p-4"
              style={{ backgroundColor: bookColor }}
            >
              <div className="text-white font-serif text-center">
                <p className="font-bold text-lg line-clamp-3">{book.title}</p>
                <p className="text-sm mt-2 opacity-80">{book.author}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger className="p-1 bg-white/80 rounded-full">
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
