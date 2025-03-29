
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Book } from '@/types/book';
import { toast } from "sonner";
import * as bookService from '@/services/bookService';
import { isUsingDemoCredentials, shouldUseFallback } from '@/lib/supabase';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useSupabase } from '@/hooks/useSupabase';
import { createSeriesBooks } from '@/services/bookMappers';
import * as storageService from '@/services/storageService';

interface BookshelfContextType {
  books: Book[];
  recommendations: Book[];
  addBook: (book: Omit<Book, 'id'>, totalSeriesBooks?: number, totalSeriesPages?: number) => void;
  removeBook: (id: string) => void;
  editBook: (id: string, bookData: Partial<Book>) => void;
  reorderBooks: (currentOrder: string[], newOrder: string[]) => void;
  updateProgress: (id: string, progress: number) => void;
  toggleFavorite: (id: string) => void;
  recoverData: () => void;
  hasBackup: boolean;
}

const BookshelfContext = createContext<BookshelfContextType | undefined>(undefined);

export const useBookshelf = () => {
  const context = useContext(BookshelfContext);
  if (context === undefined) {
    throw new Error('useBookshelf must be used within a BookshelfProvider');
  }
  return context;
};

export const BookshelfProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasBackup, setHasBackup] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [useLocalStorageState, setUseLocalStorageState] = useState<boolean>(shouldUseFallback());
  const isMounted = useRef(true);
  const lastRefreshTime = useRef<number>(Date.now());
  
  const localStorage = useLocalStorage();
  const supabaseStorage = useSupabase();
  
  // Initial data cleanup
  useEffect(() => {
    storageService.cleanupStorage();
  }, []);
  
  const { 
    books = [], 
    recommendations = [],
    setBooks,
    setRecommendations
  } = useLocalStorageState ? localStorage : supabaseStorage;
  
  // Ensure we're using localStorage for maximum stability
  useEffect(() => {
    setUseLocalStorageState(true);
  }, []);
  
  useEffect(() => {
    console.log(`BookshelfProvider initialized. Using localStorage: ${useLocalStorageState}`);
    console.log(`Current books count: ${books.length}, recommendations count: ${recommendations.length}`);
  }, [useLocalStorageState, books.length, recommendations.length]);
  
  useEffect(() => {
    if (!useLocalStorageState && 'isLoading' in supabaseStorage) {
      setIsLoading(supabaseStorage.isLoading);
    } else {
      setIsLoading(false);
    }
  }, [useLocalStorageState, supabaseStorage]);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Private refresh data function with test book filtering
  const refreshData = async () => {
    try {
      setIsLoading(true);
      console.log('Auto-refreshing data...');
      
      let booksData: Book[] = [];
      let recommendationsData: Book[] = [];
      
      if (useLocalStorageState) {
        // Use localStorage for data retrieval
        booksData = storageService.getStoredBooks();
        recommendationsData = storageService.getStoredRecommendations();
      } else {
        // Try to get from service, which may fall back to localStorage
        [booksData, recommendationsData] = await Promise.all([
          bookService.getAllBooks(),
          bookService.getAllRecommendations()
        ]);
      }
      
      // Filter out test books
      booksData = booksData.filter(book => {
        return !book.title.includes('Sample Book') && 
               book.title !== 'hk' && 
               book.title !== 'ver';
      });
      
      recommendationsData = recommendationsData.filter(book => {
        return !book.title.includes('Sample Book') && 
               book.title !== 'hk' && 
               book.title !== 'ver';
      });
      
      if (isMounted.current) {
        console.log(`Refreshed data: ${booksData.length} books and ${recommendationsData.length} recommendations`);
        setBooks(booksData);
        setRecommendations(recommendationsData);
        lastRefreshTime.current = Date.now();
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  };

  const addBook = async (
    book: Omit<Book, 'id'>, 
    totalSeriesBooks?: number, 
    totalSeriesPages?: number
  ) => {
    try {
      console.log('Adding book:', book.title);
      
      // Include totalSeriesBooks and totalSeriesPages in the book data if provided
      const bookWithSeriesData = {
        ...book,
        totalSeriesBooks,
        totalSeriesPages
      };
      
      if (book.isSeries && totalSeriesBooks && totalSeriesPages && totalSeriesBooks > 1) {
        const seriesBooks = createSeriesBooks(bookWithSeriesData, totalSeriesBooks, totalSeriesPages);
        
        const addPromises = seriesBooks.map(seriesBook => bookService.addBook(seriesBook));
        const newBooks = await Promise.all(addPromises);
        
        if (useLocalStorageState) {
          if (book.status === 'recommendation') {
            setRecommendations(prev => {
              const filtered = prev.filter(b => 
                !b.title.includes('Sample Book') && 
                b.title !== 'hk' && 
                b.title !== 'ver'
              );
              return [...filtered, ...newBooks];
            });
          } else {
            setBooks(prev => {
              const filtered = prev.filter(b => 
                !b.title.includes('Sample Book') && 
                b.title !== 'hk' && 
                b.title !== 'ver'
              );
              return [...filtered, ...newBooks];
            });
          }
        }
        
        toast.success(`Added ${seriesBooks.length} books in the ${book.seriesName} series!`);
        
        // Refresh data after adding series books
        await refreshData();
      } else {
        const newBook = await bookService.addBook(bookWithSeriesData);
        
        if (useLocalStorageState) {
          if (book.status === 'recommendation') {
            setRecommendations(prev => {
              const filtered = prev.filter(b => 
                !b.title.includes('Sample Book') && 
                b.title !== 'hk' && 
                b.title !== 'ver'
              );
              return [...filtered, newBook];
            });
          } else {
            setBooks(prev => {
              const filtered = prev.filter(b => 
                !b.title.includes('Sample Book') && 
                b.title !== 'hk' && 
                b.title !== 'ver'
              );
              return [...filtered, newBook];
            });
          }
          console.log(`Book added successfully. New count: ${book.status === 'recommendation' ? recommendations.length + 1 : books.length + 1}`);
        } else {
          // Always refresh after adding a book
          await refreshData();
        }
        
        if (book.status === 'recommendation') {
          toast.success('Thank you for your recommendation!');
        } else {
          toast.success('Book added to your shelf!');
        }
      }
    } catch (error) {
      console.error('Error adding book:', error);
      toast.error('Failed to add book');
      await refreshData(); // Try to refresh data anyway
    }
  };

  const removeBook = async (id: string) => {
    try {
      const isRecommendation = recommendations.some(rec => rec.id === id);
      
      // First update our state immediately for better UX
      if (isRecommendation) {
        setRecommendations(prev => prev.filter(book => book.id !== id));
      } else {
        setBooks(prev => prev.filter(book => book.id !== id));
      }
      
      // Now perform the delete operation
      await bookService.deleteBook(id, isRecommendation);
      
      // Make sure local storage is also updated
      storageService.deleteStoredBook(id, isRecommendation);
      
      // Refresh data to ensure consistency
      await refreshData();
      
      toast.info(isRecommendation ? 'Recommendation removed' : 'Book removed from your shelf');
    } catch (error) {
      console.error('Error removing book:', error);
      toast.error('Failed to remove book');
      await refreshData(); // Try to refresh data anyway
    }
  };

  const editBook = async (id: string, bookData: Partial<Book>) => {
    try {
      const isRecommendation = recommendations.some(rec => rec.id === id);
      
      // Update state immediately for better UX
      if (isRecommendation) {
        setRecommendations(prev => 
          prev.map(book => book.id === id ? { ...book, ...bookData } : book)
        );
      } else {
        setBooks(prev => 
          prev.map(book => book.id === id ? { ...book, ...bookData } : book)
        );
      }
      
      // Now perform the update operation
      const updatedBook = await bookService.updateBook(id, bookData, isRecommendation);
      
      // Make sure local storage is also updated
      storageService.updateStoredBook(id, bookData, isRecommendation);
      
      // Refresh data to ensure consistency
      await refreshData();
      
      toast.success('Book updated successfully!');
    } catch (error) {
      console.error('Error editing book:', error);
      toast.error('Failed to update book');
      
      // Always try to refresh data if there was an error
      await refreshData();
    }
  };

  const updateProgress = async (id: string, progress: number) => {
    const status = progress === 100 ? 'read' : 'reading';
    
    try {
      // Update state immediately for better UX
      setBooks(prev => 
        prev.map(book => book.id === id ? { ...book, progress, status } : book)
      );
      
      // Now perform the update operation
      await bookService.updateBook(id, { progress, status });
      
      // Make sure local storage is also updated
      storageService.updateStoredBook(id, { progress, status });
      
      // Refresh data to ensure consistency
      await refreshData();
      
      toast.success('Reading progress updated!');
    } catch (error) {
      console.error('Error updating progress:', error);
      toast.error('Failed to update progress');
      await refreshData(); // Try to refresh data anyway
    }
  };

  const toggleFavorite = async (id: string) => {
    const isRecommendation = recommendations.some(rec => rec.id === id);
    const collection = isRecommendation ? recommendations : books;
    const book = collection.find(b => b.id === id);
    
    if (book) {
      try {
        // Update state immediately for better UX
        if (isRecommendation) {
          setRecommendations(prev => 
            prev.map(b => b.id === id ? { ...b, favorite: !b.favorite } : b)
          );
        } else {
          setBooks(prev => 
            prev.map(b => b.id === id ? { ...b, favorite: !b.favorite } : b)
          );
        }
        
        // Now perform the update operation
        await bookService.updateBook(id, { favorite: !book.favorite }, isRecommendation);
        
        // Make sure local storage is also updated
        storageService.updateStoredBook(id, { favorite: !book.favorite }, isRecommendation);
        
        // Refresh data to ensure consistency
        await refreshData();
        
        toast.success('Favorite status updated!');
      } catch (error) {
        console.error('Error toggling favorite:', error);
        toast.error('Failed to update favorite status');
        await refreshData(); // Try to refresh data anyway
      }
    }
  };

  const reorderBooks = async (currentOrder: string[], newOrder: string[]) => {
    try {
      // Create a new array based on the new order
      const reorderedBooks = newOrder
        .map(id => books.find(book => book.id === id))
        .filter(Boolean) as Book[];
      
      // Update state immediately with the reordered books
      setBooks(prev => {
        // Combine reordered books with any books not in the order array
        const booksNotInOrder = prev.filter(book => !newOrder.includes(book.id));
        return [...reorderedBooks, ...booksNotInOrder];
      });
      
      // Update the book order in the service
      await bookService.updateBookOrder(newOrder);
      
      // Make sure local storage is also updated
      storageService.updateStoredBookOrder(newOrder);
      
      // Refresh data to ensure consistency
      await refreshData();
      
      toast.success('Books reordered successfully!');
    } catch (error) {
      console.error('Error reordering books:', error);
      toast.error('Failed to reorder books');
      await refreshData(); // Try to refresh data anyway
    }
  };

  const recoverData = async () => {
    try {
      console.log('Attempting to recover data from service...');
      
      // Clean storage first to remove test books
      storageService.cleanupStorage();
      
      // Get data from localStorage for maximum reliability
      const booksData = storageService.getStoredBooks();
      const recommendationsData = storageService.getStoredRecommendations();
      
      if (isMounted.current) {
        console.log(`Recovered ${booksData.length} books and ${recommendationsData.length} recommendations`);
        setBooks(booksData);
        setRecommendations(recommendationsData);
        lastRefreshTime.current = Date.now();
        toast.success(`Recovered ${booksData.length} books and ${recommendationsData.length} recommendations`);
      }
    } catch (error) {
      console.error('Error recovering data:', error);
      toast.error('Failed to recover books');
    }
  };

  // Set up a more aggressive auto-refresh every 5 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      const now = Date.now();
      const timeSinceLastRefresh = now - lastRefreshTime.current;
      
      // Refresh every 5 seconds if not loading
      if (timeSinceLastRefresh > 5000 && !isLoading) {
        refreshData();
      }
    }, 5000);
    
    return () => clearInterval(intervalId);
  }, [isLoading]);

  // Refresh data after user interactions
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshData();
      }
    };
    
    const handleUserActivity = () => {
      const now = Date.now();
      const timeSinceLastRefresh = now - lastRefreshTime.current;
      
      // Only refresh if it's been more than 3 seconds since the last refresh
      if (timeSinceLastRefresh > 3000) {
        refreshData();
      }
    };
    
    // Listen for visibility changes (tab focus)
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Listen for user interactions
    window.addEventListener('mousedown', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('scroll', handleUserActivity);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('mousedown', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('scroll', handleUserActivity);
    };
  }, []);

  const value = {
    books,
    recommendations,
    addBook,
    removeBook,
    editBook,
    updateProgress,
    toggleFavorite,
    reorderBooks,
    recoverData,
    hasBackup
  };

  useEffect(() => {
    const shouldRecover = books.length === 0 && recommendations.length === 0 && !isLoading;
    
    if (shouldRecover) {
      console.log('No books found in state, attempting to recover data...');
      recoverData();
    }
  }, [isLoading, books.length, recommendations.length]);

  return (
    <BookshelfContext.Provider value={value}>
      {children}
    </BookshelfContext.Provider>
  );
};
