import React from 'react';
import { Book } from '@/types/book';
import { cn } from '@/lib/utils';

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
          className="w-32 h-48 flex items-center justify-center rounded-md shadow-lg"
          style={{ backgroundColor: book.color || '#3B82F6' }}
        >
          <span className="text-white text-lg font-bold">{book.title.substring(0, 1)}</span>
        </div>
      )}
      {showStatus && book.status === 'reading' && (
        <div className="absolute bottom-0 left-0 w-full bg-blue-700 text-white text-xs text-center py-1 rounded-b-md">
          {book.progress}%
        </div>
      )}
    </div>
  );
};

export default BookCover;
