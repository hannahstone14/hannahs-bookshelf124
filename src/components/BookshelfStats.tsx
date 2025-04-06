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
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

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

  // Define distinct, harmonious blue colors for the pie chart
  const PIE_CHART_COLORS_BLUE = [
    '#ade8f4', // Light Sky Blue
    '#90e0ef', // Medium Sky Blue
    '#48cae4', // Bright Cerulean
    '#00b4d8', // Standard Cerulean
    '#0096c7', // Deeper Cerulean
    '#0077b6', // Steel Blue
    '#023e8a', // Dark Blue
    '#03045e'  // Very Dark Blue
  ].slice(0, chartGenreData.length); // Use only as many colors as needed

  const getGenreIcon = (genre: string) => {
    return genreIconMap[genre] || <BookCopy className="h-4 w-4 text-gray-500" />;
  };

  return (
    <div className="mb-12">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10">
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
        
        <div className="flex flex-wrap items-center justify-center md:justify-end gap-4">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 flex flex-col items-center min-w-[120px]">
            <div className="text-3xl font-semibold text-gray-800">{formatPagesRead(pagesRead)}</div>
            <h3 className="text-[11px] text-gray-500 font-medium uppercase tracking-wider mt-1">Pages Read</h3>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 flex items-center gap-4">
            <div className="flex flex-col items-center px-2">
              <div className="text-2xl font-semibold text-gray-800">{totalBooksRead}</div>
              <h3 className="text-[11px] text-gray-500 font-medium uppercase tracking-wider text-center mt-1">Books Read</h3>
            </div>
            <div className="h-8 w-px bg-gray-200"></div>
            <div className="flex flex-col items-center px-2">
              <div className="text-2xl font-semibold text-gray-800">{booksReadThisYear}</div>
              <h3 className="text-[11px] text-gray-500 font-medium uppercase tracking-wider text-center mt-1">Read In {currentYear}</h3>
            </div>
            <div className="h-8 w-px bg-gray-200"></div>
            <div className="flex flex-col items-center px-2">
              <div className="text-2xl font-semibold text-gray-800">{totalSeriesCount}</div>
              <h3 className="text-[11px] text-gray-500 font-medium uppercase tracking-wider text-center mt-1">Series</h3>
            </div>
          </div>
        </div>
      </div>
      
      {/* Grid for Pie Chart, Currently Reading, Last Finished */}
      {/* Using gap-6 (24px). Added items-stretch to make cards equal height by default */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6 items-stretch"> 
        {/* Genre Distribution Card */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 flex flex-col"> {/* Reduced padding slightly, added flex flex-col */}
          <h3 className="text-xs text-gray-500 font-semibold mb-2 uppercase text-center tracking-wider flex-shrink-0">Genre Distribution</h3> {/* Adjusted margin */}
          {chartGenreData.length > 0 ? (
            // Fix: ResponsiveContainer should directly wrap PieChart
            <ResponsiveContainer width="100%" height={180} className="flex-grow min-h-[150px]"> 
              <PieChart>
                <Pie
                  data={chartGenreData}
                  cx="50%"
                  cy="50%"
                  labelLine={false} // Disable label lines
                  outerRadius={80}
                  innerRadius={50} // Add inner radius for donut
                  fill="#8884d8"
                  dataKey="value"
                  // Add small labels inside slices
                  label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }) => {
                    const RADIAN = Math.PI / 180;
                    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                    const percentage = (percent * 100).toFixed(0);

                    // Don't render label if slice is too small
                    if (parseFloat(percentage) < 4) return null; 

                    return (
                      <text
                        x={x}
                        y={y}
                        fill="white" // White text for contrast on blue
                        textAnchor={x > cx ? 'start' : 'end'}
                        dominantBaseline="central"
                        className="text-[9px] font-medium pointer-events-none" // Small text, prevent hover events
                      >
                        {`${name} (${percentage}%)`}
                      </text>
                    );
                  }}
                >
                  {chartGenreData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS_BLUE[index % PIE_CHART_COLORS_BLUE.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'white', borderRadius: '4px', border: '1px solid #e5e7eb', padding: '4px 8px', fontSize: '12px' }}
                />
                {/* Optional: Remove Legend if labels are sufficient */}
                {/* <Legend /> */}
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex-grow flex items-center justify-center text-gray-400 text-sm">
              <BookOpenCheck className="h-8 w-8 text-gray-300 mb-2" />
              <p className="text-xs text-gray-400">Add books with genres</p>
              <p className="text-xs text-gray-400">to see distribution</p>
            </div>
          )}
        </div>

        {/* Currently Reading Card */}
        {/* Added flex flex-col to structure content vertically */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 flex flex-col"> 
          <h3 className="text-xs text-gray-500 font-semibold mb-3 uppercase tracking-wider flex-shrink-0">Currently Reading</h3> {/* Adjusted margin */}
          {currentlyReading ? (
            // Added flex-grow to allow content to take available space
            <div className="flex items-start gap-3 flex-grow"> 
              <div className="w-20 h-28 shadow-sm rounded-sm overflow-hidden flex-shrink-0"> {/* Adjusted size slightly */}
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
                    <span className="text-white text-[10px] font-bold">{currentlyReading.title.substring(0, 2)}</span>
                  </div>
                )}
              </div>
              <div className="overflow-hidden">
                <h4 className="text-sm font-medium line-clamp-2">{currentlyReading.title}</h4>
                <p className="text-gray-600 text-[11px] line-clamp-1">{currentlyReading.author}</p>
                <p className="text-gray-400 text-[11px] mt-0.5 line-clamp-1">
                  {currentlyReading.pages} pages
                </p>
                <div className="mt-1.5">
                  <div className="text-[11px] text-gray-600 mb-0.5">{currentlyReading.progress}% completed</div>
                  <Progress value={currentlyReading.progress} className="h-1.5 bg-gray-200" />
                </div>
              </div>
            </div>
          ) : (
            // Added flex-grow and centered content for empty state
            <div className="flex flex-col items-center justify-center gap-2 flex-grow text-center h-full min-h-[150px]">
              <BookOpenCheck className="h-8 w-8 text-gray-300" /> 
              <div> 
                <h4 className="text-sm font-medium text-gray-600">None</h4>
                <p className="text-gray-500 text-xs mt-1">No book currently being read.</p>
              </div>
            </div>
          )}
        </div>

        {/* Last Finished Card */}
        {/* Added flex flex-col */}
        {latestRead ? ( // Conditionally render the whole card
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 flex flex-col"> 
            <h3 className="text-xs text-gray-500 font-semibold mb-3 uppercase tracking-wider flex-shrink-0">Last Finished</h3> {/* Adjusted margin */}
             {/* Added flex-grow */}
            <div className="flex items-start gap-3 flex-grow">
              <div className="w-20 h-28 shadow-sm rounded-sm overflow-hidden flex-shrink-0"> {/* Adjusted size slightly */}
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
                    <span className="text-white text-[10px] font-bold">{latestRead.title.substring(0, 2)}</span>
                  </div>
                )}
              </div>
              <div className="overflow-hidden">
                <h4 className="text-sm font-medium line-clamp-2">{latestRead.title}</h4>
                <p className="text-gray-600 text-[11px] line-clamp-1">{latestRead.author}</p>
                <p className="text-gray-400 text-[11px] mt-0.5 line-clamp-1">
                  {latestRead.pages} pages · {latestRead.genres && latestRead.genres.length > 0 ? latestRead.genres[0] : 'No genre'}
                </p>
              </div>
            </div>
          </div>
        ) : ( // Render a placeholder or empty state if no books have been read
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 flex flex-col items-center justify-center text-center min-h-[170px]"> 
             <BookmarkCheck className="h-8 w-8 text-gray-300 mb-2" />
             <h4 className="text-sm font-medium text-gray-600">No Books Finished</h4>
             <p className="text-gray-500 text-xs mt-1">Finish reading a book to see it here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookshelfStats;
