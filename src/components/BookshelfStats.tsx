
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
      <div className="flex flex-wrap gap-6 mb-4">
        <div className="flex items-center gap-6">
          <div className="stat-pill stat-purple">
            <BookIcon className="h-4 w-4" />
            <span>{totalBooksRead} Books Read</span>
          </div>
          
          <div className="stat-pill stat-blue">
            <BookOpen className="h-4 w-4" />
            <span>{booksReadThisYear} This Year</span>
          </div>
        </div>
        
        <div className="flex-1 flex flex-wrap gap-6">
          <div className="stat-card stat-card-peach flex-1">
            <h3 className="stat-label">Favorite Genre</h3>
            <div className="stat-value">{favoriteGenre}</div>
          </div>
          
          <div className="stat-card stat-card-blue flex-1">
            <h3 className="stat-label">Last Read</h3>
            <div className="stat-value text-2xl">
              {latestRead ? latestRead.title.slice(0, 25) + (latestRead.title.length > 25 ? '...' : '') : 'None'}
            </div>
            {latestRead && <div className="text-sm text-gray-600 mt-1">{latestRead.author}</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookshelfStats;
