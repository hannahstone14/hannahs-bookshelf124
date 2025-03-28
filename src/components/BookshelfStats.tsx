
import React from 'react';
import { useBookshelf } from '@/context/BookshelfContext';
import { Book } from '@/types/book';
import { BookOpen, BookOpenCheck, BookmarkCheck } from 'lucide-react';

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
  
  // Calculate total pages read
  const pagesRead = books.reduce((total, book) => {
    // For read books, count all pages
    if (book.status === 'read') {
      return total + (book.pages || 0);
    }
    // For in-progress books, count proportional to completion
    else if (book.status === 'reading') {
      return total + (book.pages || 0) * (book.progress / 100);
    }
    return total;
  }, 0);
  
  // Format pages read in a readable way
  const formatPagesRead = (pages: number) => {
    if (pages >= 1000000) {
      return `${(pages / 1000000).toFixed(1)}M`;
    } else if (pages >= 1000) {
      return `${(pages / 1000).toFixed(0)}K`;
    }
    return pages.toFixed(0);
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
    <div className="mb-10">
      {/* Main statistics card - Pages Read */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-sm text-gray-500 font-medium">Total Pages Read</h3>
        </div>
        <div className="text-4xl font-bold mb-4">
          {formatPagesRead(pagesRead)}
        </div>
        <div className="flex items-center text-sm text-gray-500">
          <BookOpen className="h-4 w-4 mr-1" />
          <span>From {books.length} books in your collection</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Latest Read Book Card */}
        {latestRead && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-sm text-gray-500 font-medium mb-4">Last Book You Finished</h3>
            <div className="flex items-start gap-3">
              <div className="w-16 h-24 shadow-md rounded-sm overflow-hidden">
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
                <p className="text-gray-400 text-sm mt-1">
                  {latestRead.pages} pages · {latestRead.genre || 'No genre'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Favorite Genre Card */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-sm text-gray-500 font-medium mb-4">Favorite Genre</h3>
          <div className="flex flex-col">
            <span className="text-2xl font-bold mb-2">{favoriteGenre}</span>
            <span className="text-gray-500 text-sm">
              {maxCount} books in this genre
            </span>
          </div>
        </div>
      </div>

      {/* Summary Stats - Bottom Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-md p-4 flex items-center">
          <div className="rounded-full bg-blue-100 p-2 mr-3">
            <BookmarkCheck className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <div className="text-gray-500 text-sm">Total Books Read</div>
            <div className="text-2xl font-bold">{totalBooksRead}</div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-4 flex items-center">
          <div className="rounded-full bg-green-100 p-2 mr-3">
            <BookOpenCheck className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <div className="text-gray-500 text-sm">Books Read This Year</div>
            <div className="text-2xl font-bold">{booksReadThisYear}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookshelfStats;
