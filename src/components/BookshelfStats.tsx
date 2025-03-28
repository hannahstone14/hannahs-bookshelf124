
import React from 'react';
import { useBookshelf } from '@/context/BookshelfContext';
import { Book } from '@/types/book';
import { Book as BookIcon, BookOpen, Bookmark, BookmarkCheck } from 'lucide-react';

const BookshelfStats: React.FC = () => {
  const { books } = useBookshelf();
  
  // Get the current year
  const currentYear = new Date().getFullYear();
  
  // Calculate total books read
  const totalBooksRead = books.filter(book => book.status === 'read').length;
  
  // Calculate books read this year
  const booksReadThisYear = books.filter(
    book => book.status === 'read' && book.dateRead.getFullYear() === currentYear
  ).length;
  
  // Find most popular/favorite genre
  const genreCounts: Record<string, number> = {};
  books.forEach(book => {
    if (book.genre) {
      genreCounts[book.genre] = (genreCounts[book.genre] || 0) + 1;
    }
  });
  
  let favoriteGenre = 'None';
  let maxCount = 0;
  
  Object.entries(genreCounts).forEach(([genre, count]) => {
    if (count > maxCount) {
      favoriteGenre = genre;
      maxCount = count;
    }
  });
  
  // Find the latest read book
  const readBooks = books.filter(book => book.status === 'read');
  const latestRead = readBooks.length > 0 
    ? readBooks.reduce((latest: Book | null, book) => {
        if (!latest) return book;
        return book.dateRead > latest.dateRead ? book : latest;
      }, null)
    : null;

  return (
    <div className="mb-8">
      <div className="flex flex-wrap justify-center gap-6 mb-4">
        <div className="stat-pill stat-purple">
          <BookIcon className="h-4 w-4" />
          <span>{totalBooksRead} Books Read</span>
        </div>
        
        <div className="stat-pill stat-blue">
          <BookOpen className="h-4 w-4" />
          <span>{booksReadThisYear} This Year</span>
        </div>
        
        <div className="stat-pill stat-orange">
          <Bookmark className="h-4 w-4" />
          <span>{favoriteGenre} ★</span>
        </div>
        
        <div className="stat-pill stat-green">
          <BookmarkCheck className="h-4 w-4" />
          <span>{latestRead ? latestRead.title.slice(0, 20) + (latestRead.title.length > 20 ? '...' : '') : 'None'}</span>
        </div>
      </div>
    </div>
  );
};

export default BookshelfStats;
