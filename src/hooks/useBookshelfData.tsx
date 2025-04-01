
import { useState, useCallback, useEffect } from 'react';
import { Book } from '@/types/book';
import { ViewTab, SortOption } from '@/components/bookshelf/BookshelfTabs';

export const useBookshelfData = (
  books: Book[],
  recommendations: Book[]
) => {
  const [viewTab, setViewTab] = useState<ViewTab>('shelf');
  const [displayStyle, setDisplayStyle] = useState<'shelf' | 'list'>('shelf');
  const [sortBy, setSortBy] = useState<SortOption>('dateRead');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [booksToDisplay, setBooksToDisplay] = useState<Book[]>([]);
  
  // Filter books based on status
  const allShelfBooks = books.filter(book => book.status !== 'to-read');
  const toReadBooks: Book[] = [];
  
  // Calculate series data
  const seriesBooks = books.filter(book => book.isSeries);
  const uniqueSeriesNames = new Set();
  
  seriesBooks.forEach(book => {
    if (book.seriesName) {
      uniqueSeriesNames.add(book.seriesName);
    } else {
      uniqueSeriesNames.add(book.id);
    }
  });
  
  const seriesCount = uniqueSeriesNames.size;

  // Sort books based on current sort settings
  const getSortedBooks = useCallback((booksToSort: Book[]) => {
    return [...booksToSort].sort((a, b) => {
      let comparison = 0;
      
      switch(sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'author':
          comparison = a.author.localeCompare(b.author);
          break;
        case 'dateRead':
          if (!a.dateRead) return sortOrder === 'asc' ? -1 : 1;
          if (!b.dateRead) return sortOrder === 'asc' ? 1 : -1;
          
          const dateA = a.dateRead instanceof Date ? a.dateRead.getTime() : new Date(a.dateRead).getTime();
          const dateB = b.dateRead instanceof Date ? b.dateRead.getTime() : new Date(b.dateRead).getTime();
          
          comparison = dateA - dateB;
          break;
        case 'progress':
          comparison = a.progress - b.progress;
          break;
        case 'favorite':
          comparison = (a.favorite === b.favorite) ? 0 : a.favorite ? -1 : 1;
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [sortBy, sortOrder]);

  // Update displayed books when tab or sort changes
  useEffect(() => {
    let displayedBooks: Book[] = [];
    
    switch(viewTab) {
      case 'to-read':
        displayedBooks = getSortedBooks(toReadBooks);
        break;
      case 'recommendations':
        displayedBooks = getSortedBooks(recommendations);
        break;
      case 'shelf':
      case 'list':
      default:
        displayedBooks = getSortedBooks(allShelfBooks);
        break;
    }
    
    setBooksToDisplay(displayedBooks);
  }, [viewTab, sortBy, sortOrder, books, recommendations, getSortedBooks, toReadBooks, allShelfBooks]);

  // Handle tab changes
  const handleTabChange = useCallback((value: string) => {
    const newTab = value as ViewTab;
    setViewTab(newTab);
    
    if (newTab === 'shelf' || newTab === 'list') {
      setDisplayStyle(newTab);
    }
  }, []);

  // Handle sort changes
  const handleSort = useCallback((option: SortOption) => {
    if (sortBy === option) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(option);
      setSortOrder('desc');
    }
  }, [sortBy, sortOrder]);

  return {
    viewTab,
    displayStyle,
    sortBy, 
    sortOrder,
    booksToDisplay,
    handleTabChange,
    handleSort,
    seriesCount,
    allShelfBooks,
    toReadBooks
  };
};
