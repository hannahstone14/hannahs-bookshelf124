import React from 'react';
import { useBookshelf } from '@/context/BookshelfContext';
import { Book, BookOpenText, Library, BookMarked, Bookmark } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const BookshelfStats: React.FC = () => {
  const { books, getTotalBooksCount } = useBookshelf();
  
  // Calculate total pages read
  const pagesRead = books.reduce((total, book) => {
    if (book.status === 'read' && book.pages) {
      return total + book.pages;
    }
    return total;
  }, 0);
  
  // Format pages read to show as 3k if over 1000
  const formattedPagesRead = pagesRead >= 1000 
    ? `${(pagesRead / 1000).toFixed(1)}k` 
    : pagesRead.toString();
  
  // Count books read in the current year
  const currentYear = new Date().getFullYear();
  const booksReadThisYear = books.filter(book => {
    if (book.status !== 'read' || !book.dateRead) return false;
    const readDate = new Date(book.dateRead);
    return readDate.getFullYear() === currentYear;
  }).length;
  
  // Count series
  const seriesNames = new Set<string>();
  books.forEach(book => {
    if (book.isSeries && book.seriesName) {
      seriesNames.add(book.seriesName);
    }
  });
  
  const totalSeries = seriesNames.size;
  const totalBooks = getTotalBooksCount();
  
  // Find currently reading book
  const currentlyReading = books.find(book => book.status === 'reading');
  
  // Find last read book
  const lastReadBook = [...books]
    .filter(book => book.status === 'read' && book.dateRead)
    .sort((a, b) => new Date(b.dateRead).getTime() - new Date(a.dateRead).getTime())[0];
    
  // Get top genres
  const genreCounts = books.reduce((counts, book) => {
    if (book.genres && book.genres.length) {
      book.genres.forEach(genre => {
        counts[genre] = (counts[genre] || 0) + 1;
      });
    }
    return counts;
  }, {} as Record<string, number>);
  
  const topGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([genre]) => genre);
    
  // Get icon for genre
  const getGenreIcon = (genre: string) => {
    const lowerGenre = genre.toLowerCase();
    if (lowerGenre.includes('fantasy')) return '🧙‍♂️';
    if (lowerGenre.includes('sci-fi') || lowerGenre.includes('science')) return '🚀';
    if (lowerGenre.includes('mystery')) return '🔍';
    if (lowerGenre.includes('romance')) return '💘';
    if (lowerGenre.includes('thriller')) return '😱';
    if (lowerGenre.includes('horror')) return '👻';
    if (lowerGenre.includes('biography') || lowerGenre.includes('memoir')) return '👤';
    if (lowerGenre.includes('history')) return '📜';
    if (lowerGenre.includes('cook')) return '🍳';
    if (lowerGenre.includes('travel')) return '✈️';
    if (lowerGenre.includes('children')) return '🧸';
    if (lowerGenre.includes('comic') || lowerGenre.includes('graphic')) return '💬';
    return '📚';
  };
  
  return (
    <div className="mb-10">
      {/* Main stats section */}
      <div className="flex flex-col space-y-8 mb-6">
        {/* Pages read - highlighted stat */}
        <div className="flex justify-center">
          <div className="bg-amber-50 shadow-md rounded-xl p-6 text-center w-full max-w-sm">
            <span className="text-4xl font-bold text-amber-700">{formattedPagesRead}</span>
            <div className="flex items-center justify-center text-amber-600 text-sm mt-1">
              <span className="mr-1">📄</span>
              Pages Read
            </div>
          </div>
        </div>
        
        {/* Other stats in a row */}
        <div className="flex justify-center items-center gap-6">
          <div className="flex flex-col items-center">
            <span className="text-xl font-bold text-gray-800">{totalBooks}</span>
            <div className="flex items-center text-gray-500 text-sm">
              <Book className="h-4 w-4 mr-1 text-blue-700" />
              Books Read
            </div>
          </div>
          
          <div className="flex flex-col items-center">
            <span className="text-xl font-bold text-gray-800">{booksReadThisYear}</span>
            <div className="flex items-center text-gray-500 text-sm">
              <BookOpenText className="h-4 w-4 mr-1 text-green-600" />
              Read in {currentYear}
            </div>
          </div>
          
          <div className="flex flex-col items-center">
            <span className="text-xl font-bold text-gray-800">{totalSeries}</span>
            <div className="flex items-center text-gray-500 text-sm">
              <Library className="h-4 w-4 mr-1 text-purple-600" />
              Series
            </div>
          </div>
        </div>
      </div>
      
      {/* Reading status and genres */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Currently Reading */}
        <div className="bg-white shadow rounded-lg p-4">
          <h3 className="text-lg font-medium mb-3 flex items-center">
            <BookMarked className="h-5 w-5 mr-2 text-blue-600" />
            Currently Reading
          </h3>
          
          {currentlyReading ? (
            <div className="flex items-start space-x-3">
              <div className="w-16 h-24 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                {currentlyReading.coverUrl ? (
                  <img 
                    src={currentlyReading.coverUrl} 
                    alt={currentlyReading.title} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-300">
                    <Book className="h-8 w-8 text-gray-500" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm line-clamp-1">{currentlyReading.title}</p>
                <p className="text-gray-500 text-xs mb-2">{currentlyReading.author}</p>
                <Progress value={currentlyReading.progress || 0} className="h-2 mb-1" />
                <p className="text-xs text-gray-500">{currentlyReading.progress || 0}% complete</p>
              </div>
            </div>
          ) : (
            <div className="text-gray-500 text-sm italic">No book currently being read</div>
          )}
        </div>
        
        {/* Last Finished */}
        <div className="bg-white shadow rounded-lg p-4">
          <h3 className="text-lg font-medium mb-3 flex items-center">
            <Bookmark className="h-5 w-5 mr-2 text-green-600" />
            Last Finished
          </h3>
          
          {lastReadBook ? (
            <div className="flex items-start space-x-3">
              <div className="w-16 h-24 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                {lastReadBook.coverUrl ? (
                  <img 
                    src={lastReadBook.coverUrl} 
                    alt={lastReadBook.title} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-300">
                    <Book className="h-8 w-8 text-gray-500" />
                  </div>
                )}
              </div>
              <div>
                <p className="font-medium text-sm line-clamp-1">{lastReadBook.title}</p>
                <p className="text-gray-500 text-xs">{lastReadBook.author}</p>
                {lastReadBook.dateRead && (
                  <p className="text-xs text-gray-500 mt-1">
                    Finished: {new Date(lastReadBook.dateRead).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-gray-500 text-sm italic">No finished books yet</div>
          )}
        </div>
        
        {/* Top Genres */}
        <div className="bg-white shadow rounded-lg p-4">
          <h3 className="text-lg font-medium mb-3">Top Genres</h3>
          
          {topGenres.length > 0 ? (
            <div className="space-y-2">
              {topGenres.map((genre, index) => (
                <div key={index} className="flex items-center">
                  <span className="mr-2 text-lg">{getGenreIcon(genre)}</span>
                  <span className="text-sm">{genre}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 text-sm italic">No genres yet</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookshelfStats;
