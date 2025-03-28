
import React from 'react';
import { useBookshelf } from '@/context/BookshelfContext';
import { Book } from '@/types/book';
import { BookOpen, BookOpenCheck, BookmarkCheck, Archive, Coffee, Bookmark, BookMarked, Stars, Rocket, Brain, BookCopy } from 'lucide-react';

// Map of genre to icon component
const genreIconMap: Record<string, React.ReactNode> = {
  'Fiction': <BookCopy className="h-4 w-4 text-blue-500" />,
  'Non-Fiction': <Brain className="h-4 w-4 text-purple-500" />,
  'Science Fiction': <Rocket className="h-4 w-4 text-green-500" />,
  'Fantasy': <Stars className="h-4 w-4 text-amber-500" />,
  'Mystery': <BookMarked className="h-4 w-4 text-red-500" />,
  'History': <Archive className="h-4 w-4 text-brown-500" />,
  'Romance': <Bookmark className="h-4 w-4 text-pink-500" />,
  'Self-Help': <Coffee className="h-4 w-4 text-teal-500" />
};

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
  
  // Calculate genre counts for top 3 genres
  const genreCounts: Record<string, number> = {};
  books.forEach(book => {
    if (book.genres && book.genres.length > 0) {
      book.genres.forEach(genre => {
        genreCounts[genre] = (genreCounts[genre] || 0) + 1;
      });
    }
  });
  
  // Get top 3 genres
  const topGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([genre, count]) => ({ genre, count }));
  
  // Find the latest read book
  const readBooks = books.filter(book => book.status === 'read');
  const latestRead = readBooks.length > 0 
    ? readBooks.reduce((latest: Book | null, book) => {
        if (!latest) return book;
        return book.dateRead > latest.dateRead ? book : latest;
      }, null)
    : null;

  // Get icon for a genre
  const getGenreIcon = (genre: string) => {
    return genreIconMap[genre] || <BookCopy className="h-4 w-4 text-gray-500" />;
  };

  return (
    <div className="mb-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Main statistics card - Pages Read */}
        <div className="md:col-span-2 bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-sm text-gray-500 font-medium">PAGES READ</h3>
          </div>
          <div className="text-4xl font-bold mb-4">
            {formatPagesRead(pagesRead)}
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <BookOpen className="h-4 w-4 mr-1" />
            <span>From {books.length} books in your collection</span>
          </div>
          
          {/* Books read stats in smaller size */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">Total Books Read</div>
              <div className="text-xl font-semibold">{totalBooksRead}</div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">Books Read in {currentYear}</div>
              <div className="text-xl font-semibold">{booksReadThisYear}</div>
            </div>
          </div>
        </div>

        {/* Top 3 Genres Card */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-sm text-gray-500 font-medium mb-4">TOP 3 GENRES</h3>
          {topGenres.length > 0 ? (
            <div className="space-y-4">
              {topGenres.map((item, index) => (
                <div key={item.genre} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                      index === 0 ? 'bg-yellow-100 text-yellow-600' : 
                      index === 1 ? 'bg-gray-100 text-gray-600' : 
                      'bg-amber-100 text-amber-600'
                    }`}>
                      {getGenreIcon(item.genre)}
                    </div>
                    <span className="font-medium">{item.genre}</span>
                  </div>
                  <span className="text-gray-500">{item.count} books</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 text-center py-4">
              Add books with genres to see statistics
            </div>
          )}
        </div>
      </div>

      {/* Latest Read Book Card */}
      {latestRead && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h3 className="text-sm text-gray-500 font-medium mb-4">LAST BOOK YOU FINISHED</h3>
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
                {latestRead.pages} pages · {latestRead.genres && latestRead.genres.length > 0 ? latestRead.genres[0] : 'No genre'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookshelfStats;
