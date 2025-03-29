
import React from 'react';
import { Book } from '@/types/book';
import { cn } from '@/lib/utils';
import { BookMarked } from 'lucide-react';

interface BookCoverProps {
  book: Book;
  showStatus?: boolean;
}

const BookCover: React.FC<BookCoverProps> = ({ book, showStatus }) => {
  return (
    <div className="relative">
      {book.coverUrl ? (
        <img
          src={book.coverUrl}
          alt={book.title}
          className="w-32 h-48 object-cover rounded-md shadow-lg"
        />
      ) : (
        <div
          className="w-32 h-48 flex items-center justify-center rounded-md shadow-lg relative"
          style={{ backgroundColor: book.color || '#3B82F6' }}
        >
          <span className="text-white text-lg font-bold">{book.title.substring(0, 1)}</span>
          {book.isSeries && (
            <div className="absolute bottom-2 right-2 bg-purple-700 text-white p-1 rounded-full">
              <BookMarked size={16} />
            </div>
          )}
        </div>
      )}
      {showStatus && book.status === 'reading' && (
        <div className="absolute bottom-0 left-0 w-full bg-blue-700 text-white text-xs text-center py-1 rounded-b-md">
          {book.progress}%
        </div>
      )}
      {book.isSeries && book.coverUrl && (
        <div className="absolute top-1 right-1 bg-purple-700 text-white p-1 rounded-full">
          <BookMarked size={14} />
        </div>
      )}
      {book.isSeries && book.seriesPosition && (
        <div className="absolute top-1 left-1 bg-purple-700 text-white px-1.5 py-0.5 text-xs font-bold rounded-full">
          #{book.seriesPosition}
        </div>
      )}
    </div>
  );
};

export default BookCover;
