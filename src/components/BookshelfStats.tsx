
import React from 'react';
import { useBookshelf } from '@/context/BookshelfContext';
import { Card, CardContent } from '@/components/ui/card';
import { Book } from '@/types/book';
import { Calendar, BookOpen, BarChart2, BookText, BookMarked } from 'lucide-react';

const BookshelfStats: React.FC = () => {
  const { books } = useBookshelf();
  
  // Get the current year
  const currentYear = new Date().getFullYear();
  
  // Calculate statistics
  const booksReadThisYear = books.filter(
    book => book.status === 'read' && book.dateRead.getFullYear() === currentYear
  ).length;
  
  const currentlyReading = books.filter(book => book.status === 'reading').length;
  
  // Find most popular genre
  const genreCounts: Record<string, number> = {};
  books.forEach(book => {
    if (book.genre) {
      genreCounts[book.genre] = (genreCounts[book.genre] || 0) + 1;
    }
  });
  
  let mostPopularGenre = 'None';
  let maxCount = 0;
  
  Object.entries(genreCounts).forEach(([genre, count]) => {
    if (count > maxCount) {
      mostPopularGenre = genre;
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <Card className="bg-paper border-bookshelf-medium/20 shadow-sm hover:shadow transition-shadow">
        <CardContent className="p-6 flex items-center space-x-4">
          <div className="bg-burgundy/10 p-3 rounded-full">
            <Calendar className="h-6 w-6 text-burgundy" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Books Read This Year</p>
            <h3 className="text-2xl font-serif font-medium">{booksReadThisYear}</h3>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-paper border-bookshelf-medium/20 shadow-sm hover:shadow transition-shadow">
        <CardContent className="p-6 flex items-center space-x-4">
          <div className="bg-burgundy/10 p-3 rounded-full">
            <BarChart2 className="h-6 w-6 text-burgundy" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Most Popular Genre</p>
            <h3 className="text-2xl font-serif font-medium">{mostPopularGenre}</h3>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-paper border-bookshelf-medium/20 shadow-sm hover:shadow transition-shadow">
        <CardContent className="p-6 flex items-center space-x-4">
          <div className="bg-burgundy/10 p-3 rounded-full">
            <BookText className="h-6 w-6 text-burgundy" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Latest Read</p>
            <h3 className="text-2xl font-serif font-medium truncate">
              {latestRead ? latestRead.title : 'None'}
            </h3>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-paper border-bookshelf-medium/20 shadow-sm hover:shadow transition-shadow">
        <CardContent className="p-6 flex items-center space-x-4">
          <div className="bg-burgundy/10 p-3 rounded-full">
            <BookOpen className="h-6 w-6 text-burgundy" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Currently Reading</p>
            <h3 className="text-2xl font-serif font-medium">{currentlyReading}</h3>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BookshelfStats;
