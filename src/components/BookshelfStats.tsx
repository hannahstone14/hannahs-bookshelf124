
import React from 'react';
import { useBookshelf } from '@/context/BookshelfContext';
import { Book } from '@/types/book';

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
    <div className="mb-12">
      <h1 className="text-3xl font-medium mb-6">Your Reading Stats</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="stat-card stat-card-gray">
          <div className="stat-label">Books Read</div>
          <div className="stat-value">{totalBooksRead}</div>
        </div>
        
        <div className="stat-card stat-card-purple">
          <div className="stat-label text-purple-600">Read This Year</div>
          <div className="stat-value">{booksReadThisYear}</div>
        </div>
        
        <div className="stat-card stat-card-peach">
          <div className="stat-label text-orange-600">Favorite Genre</div>
          <div className="stat-value text-2xl md:text-3xl truncate">{favoriteGenre}</div>
        </div>
        
        <div className="stat-card stat-card-blue">
          <div className="stat-label text-blue-600">Latest Read</div>
          <div className="stat-value text-2xl md:text-3xl truncate">
            {latestRead ? latestRead.title : 'None'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookshelfStats;
