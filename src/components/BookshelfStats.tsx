
import React from 'react';
import { useBookshelf } from '@/context/BookshelfContext';
import { Book } from '@/types/book';
import { 
  BookCopy, 
  BookOpenCheck, 
  BookmarkCheck, 
  Archive, 
  Coffee, 
  Bookmark, 
  BookMarked, 
  Stars, 
  Rocket, 
  Brain, 
  Library,
  Glasses,
  CalendarDays,
  Layers,
  Music,
  Heart,
  Gamepad2,
  Utensils,
  Globe,
  Users,
  Palette,
  Laugh,
  Lightbulb
} from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

const genreIconMap: Record<string, React.ReactNode> = {
  'Fiction': <BookCopy className="h-4 w-4 text-blue-500" />,
  'Non-Fiction': <Brain className="h-4 w-4 text-purple-500" />,
  'Science Fiction': <Rocket className="h-4 w-4 text-green-500" />,
  'Fantasy': <Stars className="h-4 w-4 text-amber-500" />,
  'Mystery': <BookMarked className="h-4 w-4 text-red-500" />,
  'History': <Archive className="h-4 w-4 text-amber-700" />,
  'Romance': <Heart className="h-4 w-4 text-pink-500" />,
  'Self-Help': <Coffee className="h-4 w-4 text-teal-500" />,
  'Biography': <Glasses className="h-4 w-4 text-indigo-500" />,
  'Thriller': <BookMarked className="h-4 w-4 text-orange-500" />,
  'Horror': <Laugh className="h-4 w-4 text-black" />,
  'Historical Fiction': <CalendarDays className="h-4 w-4 text-amber-700" />,
  'Young Adult': <Users className="h-4 w-4 text-cyan-500" />,
  'Children': <BookCopy className="h-4 w-4 text-amber-400" />,
  'Poetry': <Bookmark className="h-4 w-4 text-pink-400" />,
  'Classics': <Library className="h-4 w-4 text-yellow-700" />,
  'Music': <Music className="h-4 w-4 text-purple-400" />,
  'Gaming': <Gamepad2 className="h-4 w-4 text-green-400" />,
  'Food': <Utensils className="h-4 w-4 text-orange-400" />,
  'Travel': <Globe className="h-4 w-4 text-blue-400" />,
  'Art': <Palette className="h-4 w-4 text-rose-500" />,
  'Philosophy': <Lightbulb className="h-4 w-4 text-yellow-500" />
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
  
  // Helper to count books properly (counting each book in a series as an individual book)
  const calculateTotalBookCount = (filterFn: (book: Book) => boolean): number => {
    return books.filter(filterFn).reduce((total, book) => {
      // If it's a stand-alone book, count as 1
      if (!book.isSeries) return total + 1;
      
      // If it's a series, count according to series position
      return total + (book.seriesPosition ? 1 : 1); // Count each position in series as one book
    }, 0);
  };
  
  // Count books read including each book in a series
  const totalBooksRead = calculateTotalBookCount(book => book.status === 'read');
  
  // Count books read this year
  const booksReadThisYear = calculateTotalBookCount(book => {
    try {
      const dateRead = ensureDate(book.dateRead);
      return book.status === 'read' && dateRead.getFullYear() === currentYear;
    } catch (error) {
      console.error('Error processing date for book:', book.title, error);
      return false;
    }
  });
  
  // Calculate series information
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
  
  // Calculate total pages read
  const calculatePagesRead = (): number => {
    return books.reduce((total, book) => {
      if (book.status === 'read') {
        return total + (book.pages || 0);
      }
      else if (book.status === 'reading') {
        // Calculate only the read portion of the book based on progress
        return total + ((book.pages || 0) * (book.progress / 100));
      }
      return total;
    }, 0);
  };
  
  const pagesRead = calculatePagesRead();
  
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
  
  const readingBooks = books.filter(book => book.status === 'reading');
  const currentlyReading = readingBooks.length > 0 ? readingBooks[0] : null;

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
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col items-center">
            <div className="text-4xl font-bold">{formatPagesRead(pagesRead)}</div>
            <h3 className="text-xs text-gray-500 font-medium">PAGES READ</h3>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-6">
            <div className="flex flex-col items-center px-3">
              <div className="text-2xl font-bold">{totalBooksRead}</div>
              <h3 className="text-xs text-gray-500 font-medium text-center">BOOKS READ</h3>
            </div>
            
            <div className="flex flex-col items-center px-3">
              <div className="text-2xl font-bold">{booksReadThisYear}</div>
              <h3 className="text-xs text-gray-500 font-medium text-center">READ IN {currentYear}</h3>
            </div>
            
            <div className="flex flex-col items-center px-3">
              <div className="text-2xl font-bold">{totalSeriesCount}</div>
              <h3 className="text-xs text-gray-500 font-medium text-center">SERIES</h3>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-sm text-gray-500 font-medium mb-4 uppercase text-lg">Top Genres</h3>
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

        <div className="bg-white rounded-xl shadow-md p-6 h-full">
          <h3 className="text-sm text-gray-500 font-medium mb-4 uppercase text-lg">Currently Reading</h3>
          {currentlyReading ? (
            <div className="flex items-start gap-3">
              <div className="w-24 h-36 shadow-md rounded-sm overflow-hidden flex-shrink-0">
                {currentlyReading.coverUrl ? (
                  <img 
                    src={currentlyReading.coverUrl} 
                    alt={currentlyReading.title} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div 
                    className="w-full h-full flex items-center justify-center"
                    style={{ backgroundColor: currentlyReading.color || '#3B82F6' }}
                  >
                    <span className="text-white text-xs font-bold">{currentlyReading.title.substring(0, 2)}</span>
                  </div>
                )}
              </div>
              <div className="overflow-hidden">
                <h4 className="text-md font-medium line-clamp-2">{currentlyReading.title}</h4>
                <p className="text-gray-600 text-xs line-clamp-1">{currentlyReading.author}</p>
                <p className="text-gray-400 text-xs mt-1 line-clamp-1">
                  {currentlyReading.pages} pages
                </p>
                <div className="mt-2">
                  <div className="text-xs text-gray-600 mb-1">{currentlyReading.progress}% completed</div>
                  <Progress value={currentlyReading.progress} className="h-2 bg-gray-200" />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <div className="w-24 h-36 shadow-md rounded-sm overflow-hidden flex-shrink-0 bg-gray-200 flex items-center justify-center">
                <BookOpenCheck className="h-8 w-8 text-gray-400" />
              </div>
              <div>
                <h4 className="text-md font-medium">None</h4>
                <p className="text-gray-600 text-xs">No books currently being read</p>
                <p className="text-gray-400 text-xs mt-1">
                  Mark a book as "Reading" to see it here
                </p>
              </div>
            </div>
          )}
        </div>

        {latestRead && (
          <div className="bg-white rounded-xl shadow-md p-6 h-full">
            <h3 className="text-sm text-gray-500 font-medium mb-4 uppercase text-lg">Last Finished</h3>
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
              <div className="overflow-hidden">
                <h4 className="text-md font-medium line-clamp-2">{latestRead.title}</h4>
                <p className="text-gray-600 text-xs line-clamp-1">{latestRead.author}</p>
                <p className="text-gray-400 text-xs mt-1 line-clamp-1">
                  {latestRead.pages} pages · {latestRead.genres && latestRead.genres.length > 0 ? latestRead.genres[0] : 'No genre'}
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
