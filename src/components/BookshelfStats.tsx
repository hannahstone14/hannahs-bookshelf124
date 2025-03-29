
import React from 'react';
import { useBookshelf } from '@/context/BookshelfContext';
import { Book } from '@/types/book';
import { BookOpen, BookOpenCheck, BookmarkCheck, Archive, Coffee, Bookmark, BookMarked, Stars, Rocket, Brain, BookCopy } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

const ensureDate = (date: Date | string | number): Date => {
  if (date instanceof Date) {
    return date;
  }
  return new Date(date);
};

const BookshelfStats: React.FC = () => {
  const { books } = useBookshelf();
  
  const currentYear = new Date().getFullYear();
  
  const totalBooksRead = books.filter(book => book.status === 'read').length;
  
  const booksReadThisYear = books.filter(
    book => {
      try {
        const dateRead = ensureDate(book.dateRead);
        return book.status === 'read' && dateRead.getFullYear() === currentYear;
      } catch (error) {
        console.error('Error processing date for book:', book.title, error);
        return false;
      }
    }
  ).length;
  
  const countCompleteSeriesRead = () => {
    const seriesGroups: Record<string, Book[]> = {};
    
    books.forEach(book => {
      if (book.isSeries && book.seriesName && book.status === 'read') {
        if (!seriesGroups[book.seriesName]) {
          seriesGroups[book.seriesName] = [];
        }
        seriesGroups[book.seriesName].push(book);
      }
    });
    
    let completeSeriesCount = 0;
    
    Object.values(seriesGroups).forEach(seriesBooks => {
      if (seriesBooks.length > 1 && seriesBooks.every(book => book.status === 'read')) {
        completeSeriesCount++;
      }
    });
    
    return completeSeriesCount;
  };
  
  const totalSeriesRead = countCompleteSeriesRead();
  
  const pagesRead = books.reduce((total, book) => {
    if (book.status === 'read') {
      return total + (book.pages || 0);
    }
    else if (book.status === 'reading') {
      return total + (book.pages || 0) * (book.progress / 100);
    }
    return total;
  }, 0);
  
  const formatPagesRead = (pages: number) => {
    if (pages >= 1000000) {
      return `${(pages / 1000000).toFixed(1)}M`;
    } else if (pages >= 1000) {
      return `${(pages / 1000).toFixed(0)}K`;
    }
    return pages.toFixed(0);
  };
  
  const genreCounts: Record<string, number> = {};
  books.forEach(book => {
    if (book.genres && book.genres.length > 0) {
      book.genres.forEach(genre => {
        genreCounts[genre] = (genreCounts[genre] || 0) + 1;
      });
    }
  });
  
  const topGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([genre, count]) => ({ genre, count }));
  
  const readBooks = books.filter(book => book.status === 'read');
  const latestRead = readBooks.length > 0 
    ? readBooks.reduce((latest: Book | null, book) => {
        if (!latest) return book;
        try {
          const bookDate = ensureDate(book.dateRead);
          const latestDate = ensureDate(latest.dateRead);
          return bookDate > latestDate ? book : latest;
        } catch (error) {
          console.error('Error comparing dates for book:', book.title, error);
          return latest;
        }
      }, null)
    : null;

  const getGenreIcon = (genre: string) => {
    return genreIconMap[genre] || <BookCopy className="h-4 w-4 text-gray-500" />;
  };

  return (
    <div className="mb-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="md:col-span-2 bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-4 mb-2">
              <div className="text-4xl font-bold">
                {formatPagesRead(pagesRead)}
              </div>
              <div>
                <h3 className="text-sm text-gray-500 font-medium">PAGES READ</h3>
                <div className="flex items-center text-sm text-gray-500 mt-1">
                  <BookOpen className="h-4 w-4 mr-1" />
                  <span>From {books.length} books in your collection</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">Total Books Read</div>
              <div className="text-xl font-semibold">{totalBooksRead}</div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">Books Read in {currentYear}</div>
              <div className="text-xl font-semibold">{booksReadThisYear}</div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">Total Series Read</div>
              <div className="text-xl font-semibold">{totalSeriesRead}</div>
            </div>
          </div>
        </div>

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
