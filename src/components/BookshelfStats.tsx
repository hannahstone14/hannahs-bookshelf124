
import React from 'react';
import { useBookshelf } from '@/context/BookshelfContext';
import { Book, BookOpenText, Library } from 'lucide-react';

const BookshelfStats: React.FC = () => {
  const { books, getTotalBooksCount } = useBookshelf();
  
  // Calculate total pages read
  const pagesRead = books.reduce((total, book) => {
    if (book.status === 'read' && book.pages) {
      return total + book.pages;
    }
    return total;
  }, 0);
  
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
  
  return (
    <div className="flex flex-row justify-center items-center gap-6 mb-6">
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
      
      <div className="flex flex-col items-center">
        <span className="text-xl font-bold text-gray-800">{pagesRead}</span>
        <div className="flex items-center text-gray-500 text-sm">
          <span className="text-amber-600 mr-1">📄</span>
          Pages Read
        </div>
      </div>
    </div>
  );
};

export default BookshelfStats;
