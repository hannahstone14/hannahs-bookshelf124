
import React from 'react';
import { useBookshelf } from '@/context/BookshelfContext';
import { Book } from '@/types/book';
import { Book as BookIcon, BookOpen, Bookmark, BookmarkCheck, BookOpenText } from 'lucide-react';

// Estimate words per page for calculation
const AVERAGE_WORDS_PER_PAGE = 250;

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
  
  // Calculate total words read
  const wordsRead = books.reduce((total, book) => {
    // For read books, count all words
    if (book.status === 'read') {
      return total + (book.pages || 0) * AVERAGE_WORDS_PER_PAGE;
    }
    // For in-progress books, count proportional to completion
    else if (book.status === 'reading') {
      return total + (book.pages || 0) * AVERAGE_WORDS_PER_PAGE * (book.progress / 100);
    }
    return total;
  }, 0);
  
  // Format words read in a readable way
  const formatWordsRead = (words: number) => {
    if (words >= 1000000) {
      return `${(words / 1000000).toFixed(1)}M`;
    } else if (words >= 1000) {
      return `${(words / 1000).toFixed(0)}K`;
    }
    return words.toFixed(0);
  };
  
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
    <div className="mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat-card stat-card-blue">
          <h3 className="text-sm uppercase tracking-wider opacity-80">Books Read</h3>
          <div className="flex items-center mt-1">
            <BookIcon className="h-5 w-5 mr-2 text-blue-600" />
            <span className="text-2xl font-bold">{totalBooksRead}</span>
          </div>
        </div>
        
        <div className="stat-card stat-card-green">
          <h3 className="text-sm uppercase tracking-wider opacity-80">This Year</h3>
          <div className="flex items-center mt-1">
            <BookOpen className="h-5 w-5 mr-2 text-green-600" />
            <span className="text-2xl font-bold">{booksReadThisYear}</span>
          </div>
        </div>
        
        <div className="stat-card stat-card-purple">
          <h3 className="text-sm uppercase tracking-wider opacity-80">Words Read</h3>
          <div className="flex items-center mt-1">
            <BookOpenText className="h-5 w-5 mr-2 text-purple-600" />
            <span className="text-2xl font-bold">{formatWordsRead(wordsRead)}</span>
          </div>
        </div>
        
        <div className="stat-card stat-card-amber">
          <h3 className="text-sm uppercase tracking-wider opacity-80">Favorite Genre</h3>
          <div className="mt-1">
            <span className="text-2xl font-bold">{favoriteGenre}</span>
          </div>
        </div>
      </div>
      
      {latestRead && (
        <div className="mt-4 p-4 rounded-md bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
          <h3 className="font-medium text-sm uppercase tracking-wider text-blue-700 mb-2">Last Book You Finished</h3>
          <div className="flex items-start gap-3">
            <div className="w-10 h-14 shadow-md rounded-sm overflow-hidden">
              {latestRead.coverUrl ? (
                <img 
                  src={latestRead.coverUrl} 
                  alt={latestRead.title} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div 
                  className="w-full h-full flex items-center justify-center"
                  style={{ backgroundColor: latestRead.color || '#3B82F6' }}
                >
                  <span className="text-white text-xs font-bold">{latestRead.title.substring(0, 2)}</span>
                </div>
              )}
            </div>
            <div>
              <h4 className="text-xl font-medium">{latestRead.title}</h4>
              <p className="text-gray-600">{latestRead.author}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookshelfStats;
