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
  Lightbulb,
  PlusCircle
} from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Button } from "@/components/ui/button";
import { 
  List, 
  BookOpen as BookOpenIcon,
  Bookmark as BookmarkIcon, 
  LightbulbIcon,
  ArrowDown10, 
  ArrowDownAZ, 
  ArrowDownZA, 
  Percent,
  Star,
  ArrowUpDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

const ensureDate = (dateInput: string | Date | undefined): Date => {
  if (dateInput instanceof Date) {
    return dateInput;
  }
  return new Date(dateInput);
};

interface BookshelfStatsProps {
  onAddBookClick: () => void;
}

const BookshelfStats: React.FC<BookshelfStatsProps> = ({ 
  onAddBookClick
}) => {
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

  // Process genres for Pie Chart (Top 5 + Other)
  const processGenreDataForChart = (genres: Record<string, number>) => {
    const sortedGenres = Object.entries(genres)
      .sort(([, countA], [, countB]) => countB - countA)
      .map(([name, value]) => ({ name, value }));
      
    if (sortedGenres.length <= 5) {
      return sortedGenres;
    }
    
    const top5 = sortedGenres.slice(0, 5);
    const otherCount = sortedGenres.slice(5).reduce((sum, current) => sum + current.value, 0);
    
    return [...top5, { name: 'Other', value: otherCount }];
  };
  
  const chartGenreData = processGenreDataForChart(genreCounts);

  // Define a new diverse, pastel/modern color palette
  const PIE_CHART_COLORS_DIVERSE = [
    '#8ecae6', // Light Blue
    '#a2d2ff', // Lighter Blue
    '#bde0fe', // Baby Blue
    '#ffafcc', // Pink
    '#ffc8dd', // Light Pink
    '#cdb4db', // Lilac
    '#d8e2dc', // Pale Gray
    '#e2e2e2'  // Light Gray
  ].slice(0, chartGenreData.length); // Use only as many colors as needed

  const getGenreIcon = (genre: string) => {
    return genreIconMap[genre] || <BookCopy className="h-4 w-4 text-gray-500" />;
  };

  return (
    <div className="mb-8">
      {/* Header Section - Improved Mobile Layout */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6 mb-8">
        <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-4">
          <Avatar className="h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 border-2 border-white shadow-md flex-shrink-0">
            <AvatarImage 
              src="/lovable-uploads/47602fcc-f8fb-42c1-ab12-804de5049f44.png" 
              alt="Hannah's profile" 
            />
            <AvatarFallback>HL</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl sm:text-3xl font-medium">Hannah's Library</h1>
            <p className="text-gray-500 text-sm">I do not endorse everything I read.</p>
          </div>
        </div>
        
        {/* Add Book Button - More Mobile Friendly */}
        <Button
          variant="outline"
          size="sm"
          onClick={onAddBookClick}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 h-10 shadow-md flex items-center gap-2 self-center sm:self-start"
          id="add-book-button"
          aria-label="Add a new book"
        >
          <PlusCircle className="h-4 w-4" />
          <span className="hidden sm:inline">Add Book</span>
        </Button>
      </div>

      {/* Stats Cards - Improved Mobile Layout */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3 sm:p-4 flex flex-col items-center">
          <div className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-800">{formatPagesRead(pagesRead)}</div>
          <h3 className="text-[10px] sm:text-[11px] text-gray-500 font-medium uppercase tracking-wider mt-1 text-center">Pages Read</h3>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3 sm:p-4 flex flex-col items-center">
          <div className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-800">{totalBooksRead}</div>
          <h3 className="text-[10px] sm:text-[11px] text-gray-500 font-medium uppercase tracking-wider text-center mt-1">Books Read</h3>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3 sm:p-4 flex flex-col items-center">
          <div className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-800">{booksReadThisYear}</div>
          <h3 className="text-[10px] sm:text-[11px] text-gray-500 font-medium uppercase tracking-wider text-center mt-1">Read In {currentYear}</h3>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3 sm:p-4 flex flex-col items-center">
          <div className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-800">{totalSeriesCount}</div>
          <h3 className="text-[10px] sm:text-[11px] text-gray-500 font-medium uppercase tracking-wider text-center mt-1">Series</h3>
        </div>
      </div>
      
      {/* Grid for Pie Chart, Currently Reading, Last Finished - Improved Mobile Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 items-stretch"> 
        {/* Genre Distribution Card */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 flex flex-col">
          <h3 className="text-xs text-gray-500 font-semibold mb-2 uppercase text-center tracking-wider flex-shrink-0">Genre Distribution</h3>
          {chartGenreData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180} className="flex-grow min-h-[150px]"> 
              <PieChart margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <Pie
                  data={chartGenreData}
                  cx="50%"
                  cy="50%"
                  labelLine={true} 
                  outerRadius={65} // Slightly smaller radius for better mobile fit
                  innerRadius={40} // Adjust inner radius accordingly
                  fill="#8884d8"
                  dataKey="value"
                  // Custom label component with smaller text
                  label={({ cx, cy, midAngle, outerRadius, percent, name, value }) => { 
                    const RADIAN = Math.PI / 180;
                    const radius = outerRadius + 18; 
                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                    const percentage = (percent * 100).toFixed(0);
                    
                    // Only show labels for larger slices on mobile
                    if (parseFloat(percentage) < 5) return null;

                    return (
                      <text
                        x={x}
                        y={y}
                        className="text-[8px] sm:text-[9px] fill-gray-600" 
                        textAnchor={x > cx ? 'start' : 'end'}
                        dominantBaseline="central"
                      >
                        {`${name} (${percentage}%)`} 
                      </text>
                    );
                  }}
                >
                  {chartGenreData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS_DIVERSE[index % PIE_CHART_COLORS_DIVERSE.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number, name: string, props) => {
                     const percentage = (props.payload?.percent * 100).toFixed(0);
                     return [`${value} book${value !== 1 ? 's' : ''} (${percentage}%)`, name];
                  }}
                  contentStyle={{ backgroundColor: 'white', borderRadius: '4px', border: '1px solid #e5e7eb', padding: '4px 8px', fontSize: '12px' }}
                  cursor={{ fill: 'rgba(200, 200, 200, 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex-grow flex items-center justify-center text-gray-400 text-sm">
              <div className="text-center">
                <BookOpenCheck className="h-6 w-6 text-gray-300 mb-2 mx-auto" />
                <p className="text-xs text-gray-400">Add books with genres</p>
                <p className="text-xs text-gray-400">to see distribution</p>
              </div>
            </div>
          )}
        </div>

        {/* Currently Reading Card - Improved for Mobile */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 flex flex-col"> 
          <h3 className="text-xs text-gray-500 font-semibold mb-3 uppercase tracking-wider flex-shrink-0">Currently Reading</h3>
          {currentlyReading ? (
            <div className="flex items-start gap-3 sm:gap-4 flex-grow"> 
              <div className="w-24 sm:w-28 h-36 sm:h-42 shadow-sm rounded-sm overflow-hidden flex-shrink-0"> 
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
                    <span className="text-white text-base font-bold">{currentlyReading.title.substring(0, 2)}</span>
                  </div>
                )}
              </div>
              <div className="overflow-hidden flex-grow flex flex-col justify-between h-36 sm:h-42"> 
                <div>
                  <h4 className="text-sm sm:text-base font-medium line-clamp-2 mb-1">{currentlyReading.title}</h4>
                  <p className="text-gray-600 text-xs sm:text-sm line-clamp-1 mb-2">{currentlyReading.author}</p> 
                  <p className="text-gray-500 text-xs sm:text-sm mt-1 line-clamp-1"> 
                    {currentlyReading.pages} pages
                    {currentlyReading.genres && currentlyReading.genres.length > 0 && (
                      <span> · {currentlyReading.genres[0]}</span>
                    )}
                  </p>
                </div>
                
                <div className="flex items-center gap-2 mt-auto pt-2">
                  <Progress 
                    value={currentlyReading.progress} 
                    className="h-2 bg-gray-200 flex-grow" 
                  /> 
                  <span className="text-xs text-gray-600 flex-shrink-0">
                    {currentlyReading.progress}%
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 flex-grow text-center h-full min-h-[120px]">
              <BookOpenCheck className="h-6 w-6 text-gray-300" /> 
              <div> 
                <h4 className="text-sm font-medium text-gray-600">None</h4>
                <p className="text-gray-500 text-xs mt-1">No book currently being read.</p>
              </div>
            </div>
          )}
        </div>

        {/* Last Finished Card - Improved for Mobile */}
        {latestRead ? (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 flex flex-col"> 
            <h3 className="text-xs text-gray-500 font-semibold mb-3 uppercase tracking-wider flex-shrink-0">Last Finished</h3>
            <div className="flex items-start gap-3 sm:gap-4 flex-grow">
              <div className="w-24 sm:w-28 h-36 sm:h-42 shadow-sm rounded-sm overflow-hidden flex-shrink-0">
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
                     <span className="text-white text-base font-bold">{latestRead.title.substring(0, 2)}</span>
                  </div>
                )}
              </div>
              <div className="overflow-hidden flex-grow h-36 sm:h-42"> 
                <h4 className="text-sm sm:text-base font-medium line-clamp-2 mb-1">{latestRead.title}</h4>
                <p className="text-gray-600 text-xs sm:text-sm line-clamp-1 mb-2">{latestRead.author}</p>
                <p className="text-gray-500 text-xs sm:text-sm mt-1 line-clamp-1">
                  {latestRead.pages} pages · {latestRead.genres && latestRead.genres.length > 0 ? latestRead.genres[0] : 'No genre'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 flex flex-col items-center justify-center text-center min-h-[120px]"> 
             <BookmarkCheck className="h-6 w-6 text-gray-300 mb-2" />
             <h4 className="text-sm font-medium text-gray-600">No Books Finished</h4>
             <p className="text-gray-500 text-xs mt-1">Finish reading a book to see it here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookshelfStats;
