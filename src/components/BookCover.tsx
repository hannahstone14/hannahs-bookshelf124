
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
    <div className={cn(
      "relative", 
      book.isSeries && "transform transition-transform hover:scale-105"
    )}>
      {book.coverUrl ? (
        <div className={cn(
          "relative",
          book.isSeries && "border-2 border-purple-500 rounded-md"
        )}>
          {/* Layer effect for series books */}
          {book.isSeries && (
            <>
              <div className="absolute -right-2 -bottom-2 w-28 h-44 bg-purple-200 rounded-md -z-10 rotate-2" />
              <div className="absolute -right-1 -bottom-1 w-30 h-46 bg-purple-300 rounded-md -z-20 rotate-1" />
            </>
          )}
          
          <img
            src={book.coverUrl}
            alt={book.title}
            className={cn(
              "w-32 h-48 object-cover rounded-md shadow-lg",
              book.isSeries && "rounded-[5px]"
            )}
          />
          {book.isSeries && (
            <div className="absolute top-1 right-1 bg-purple-700 text-white p-1 rounded-full">
              <BookMarked size={14} />
            </div>
          )}
        </div>
      ) : (
        <div
          className={cn(
            "w-32 h-48 flex items-center justify-center rounded-md shadow-lg relative",
            book.isSeries && "border-2 border-purple-500 bg-gradient-to-b from-purple-50 to-transparent"
          )}
          style={{ backgroundColor: book.isSeries ? '#F3EEFF' : (book.color || '#3B82F6') }}
        >
          {/* Layer effect for series books without cover */}
          {book.isSeries && (
            <>
              <div className="absolute -right-2 -bottom-2 w-28 h-44 bg-purple-200 rounded-md -z-10 rotate-2" />
              <div className="absolute -right-1 -bottom-1 w-30 h-46 bg-purple-300 rounded-md -z-20 rotate-1" />
            </>
          )}
          
          <span className={cn(
            "text-lg font-bold",
            book.isSeries ? "text-purple-700" : "text-white"
          )}>
            {book.title.substring(0, 1)}
          </span>
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
      
      {book.isSeries && book.seriesPosition && (
        <div className="absolute top-1 left-1 bg-purple-700 text-white px-1.5 py-0.5 text-xs font-bold rounded-full">
          #{book.seriesPosition}
        </div>
      )}

      {book.isSeries && (
        <div className="absolute -bottom-1 left-0 right-0 mx-auto w-28 bg-purple-100 border border-purple-300 text-purple-800 text-xs text-center py-0.5 rounded-full font-medium">
          Series
        </div>
      )}
    </div>
  );
};

export default BookCover;
