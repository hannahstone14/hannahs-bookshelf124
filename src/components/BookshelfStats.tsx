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
  
  const seriesBooks = books.filter(book => book.isSeries);
  const uniqueSeriesNames = new Set();
  
  seriesBooks.forEach(book => {
    if (book.seriesName) {
      uniqueSeriesNames.add(book.seriesName);
    } else {
      uniqueSeriesNames.add(book.id);
    }
  });
  
  const totalSeriesCount = uniqueSeriesNames.size;
  
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
    .slice(0, 2) // Show only top 2 genres
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

  const toReadBooks = books.filter(book => book.status === 'to-read');
  const nextToRead = toReadBooks.length > 0 ? toReadBooks[0] : null;

  const getGenreIcon = (genre: string) => {
    return genreIconMap[genre] || <BookCopy className="h-4 w-4 text-gray-500" />;
  };

  return (
    <div className="mb-10">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Avatar className="h-32 w-32 border-2 border-white shadow-md">
            <AvatarImage 
              src="/lovable-uploads/47602fcc-f8fb-42c1-ab12-804de5049f44.png" 
              alt="Hannah's profile" 
            />
            <AvatarFallback>HL</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-medium">Hannah's Library</h1>
            <p className="text-gray-500 text-sm">I do not endorse everything I read.</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4 items-center">
          <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col items-center">
            <div className="text-4xl font-bold">{formatPagesRead(pagesRead)}</div>
            <h3 className="text-xs text-gray-500 font-medium">PAGES READ • {books.filter(book => book.status === 'read').length} BOOKS</h3>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col items-center">
            <div className="text-2xl font-bold">{totalBooksRead}</div>
            <h3 className="text-xs text-gray-500 font-medium">BOOKS READ</h3>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col items-center">
            <div className="text-2xl font-bold">{booksReadThisYear}</div>
            <h3 className="text-xs text-gray-500 font-medium">READ IN {currentYear}</h3>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col items-center">
            <div className="text-2xl font-bold">{totalSeriesCount}</div>
            <h3 className="text-xs text-gray-500 font-medium">SERIES</h3>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-sm text-gray-500 font-medium mb-4">TOP GENRES</h3>
          {topGenres.length > 0 ? (
            <div className="space-y-4">
              {topGenres.map((item, index) => (
                <div key={item.genre} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                      index === 0 ? 'bg-yellow-100 text-yellow-600' : 
                      'bg-gray-100 text-gray-600'
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

        {latestRead && (
          <div className="bg-white rounded-xl shadow-md p-6 h-full">
            <h3 className="text-xs text-gray-500 font-medium mb-4">LAST FINISHED</h3>
            <div className="flex items-start gap-3">
              <div className="w-24 h-36 shadow-md rounded-sm overflow-hidden flex-shrink-0">
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
                <h4 className="text-md font-medium">{latestRead.title}</h4>
                <p className="text-gray-600 text-xs">{latestRead.author}</p>
                <p className="text-gray-400 text-xs mt-1">
                  {latestRead.pages} pages · {latestRead.genres && latestRead.genres.length > 0 ? latestRead.genres[0] : 'No genre'}
                </p>
              </div>
            </div>
          </div>
        )}

        {nextToRead && (
          <div className="bg-white rounded-xl shadow-md p-6 h-full">
            <h3 className="text-xs text-gray-500 font-medium mb-4">NEXT READ</h3>
            <div className="flex items-start gap-3">
              <div className="w-24 h-36 shadow-md rounded-sm overflow-hidden flex-shrink-0">
                {nextToRead.coverUrl ? (
                  <img 
                    src={nextToRead.coverUrl} 
                    alt={nextToRead.title} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div 
                    className="w-full h-full flex items-center justify-center"
                    style={{ backgroundColor: nextToRead.color || '#3B82F6' }}
                  >
                    <span className="text-white text-xs font-bold">{nextToRead.title.substring(0, 2)}</span>
                  </div>
                )}
              </div>
              <div>
                <h4 className="text-md font-medium">{nextToRead.title}</h4>
                <p className="text-gray-600 text-xs">{nextToRead.author}</p>
                <p className="text-gray-400 text-xs mt-1">
                  {nextToRead.pages} pages · {nextToRead.genres && nextToRead.genres.length > 0 ? nextToRead.genres[0] : 'No genre'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookshelfStats;
