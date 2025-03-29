import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Book } from '@/types/book';
import { toast } from "sonner";
import * as bookService from '@/services/bookService';
import { isUsingDemoCredentials, shouldUseFallback, isTestBook } from '@/lib/supabase';
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
  const [useLocalStorageState, setUseLocalStorageState] = useState<boolean>(true);
  const isMounted = useRef(true);
  const lastRefreshTime = useRef<number>(Date.now());
  
  const localStorage = useLocalStorage();
  const supabaseStorage = useSupabase();
  
  useEffect(() => {
    storageService.purgeTestBooks();
  }, []);
  
  const { 
    books = [], 
    recommendations = [],
    setBooks,
    setRecommendations
  } = useLocalStorageState ? localStorage : supabaseStorage;
  
  useEffect(() => {
    if (!useLocalStorageState) {
      setUseLocalStorageState(true);
      console.log('Forced using localStorage to true for stability');
    }
  }, [useLocalStorageState]);
  
  useEffect(() => {
    console.log(`BookshelfProvider initialized. Using localStorage: ${useLocalStorageState}`);
    console.log(`Current books count: ${books.length}, recommendations count: ${recommendations.length}`);
    
    if (books.some(isTestBook) || recommendations.some(isTestBook)) {
      console.log('Found test books in state, filtering them out');
      setBooks(books.filter(book => !isTestBook(book)));
      setRecommendations(recommendations.filter(book => !isTestBook(book)));
    }
  }, [useLocalStorageState, books.length, recommendations.length, setBooks, setRecommendations]);
  
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const refreshData = async () => {
    try {
      setIsLoading(true);
      console.log('Auto-refreshing data...');
      
      let booksData: Book[] = [];
      let recommendationsData: Book[] = [];
      
      booksData = storageService.getStoredBooks();
      recommendationsData = storageService.getStoredRecommendations();
      
      booksData = booksData.filter(book => !isTestBook(book));
      recommendationsData = recommendationsData.filter(book => !isTestBook(book));
      
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
      await refreshData();
    }
  };

  const removeBook = async (id: string) => {
    try {
      const isRecommendation = recommendations.some(rec => rec.id === id);
      
      if (isRecommendation) {
        setRecommendations(prev => prev.filter(book => book.id !== id && !isTestBook(book)));
      } else {
        setBooks(prev => prev.filter(book => book.id !== id && !isTestBook(book)));
      }
      
      await bookService.deleteBook(id, isRecommendation);
      
      storageService.deleteStoredBook(id, isRecommendation);
      
      storageService.purgeTestBooks();
      
      setTimeout(() => refreshData(), 500);
      
      toast.info(isRecommendation ? 'Recommendation removed' : 'Book removed from your shelf');
    } catch (error) {
      console.error('Error removing book:', error);
      toast.error('Failed to remove book');
      
      storageService.purgeTestBooks();
      
      setTimeout(() => refreshData(), 500);
    }
  };

  const editBook = async (id: string, bookData: Partial<Book>) => {
    try {
      const isRecommendation = recommendations.some(rec => rec.id === id);
      
      if (isRecommendation) {
        setRecommendations(prev => 
          prev.map(book => book.id === id ? { ...book, ...bookData } : book)
        );
      } else {
        setBooks(prev => 
          prev.map(book => book.id === id ? { ...book, ...bookData } : book)
        );
      }
      
      const updatedBook = await bookService.updateBook(id, bookData, isRecommendation);
      
      storageService.updateStoredBook(id, bookData, isRecommendation);
      
      await refreshData();
      
      toast.success('Book updated successfully!');
    } catch (error) {
      console.error('Error editing book:', error);
      toast.error('Failed to update book');
      
      await refreshData();
    }
  };

  const updateProgress = async (id: string, progress: number) => {
    const status = progress === 100 ? 'read' : 'reading';
    
    try {
      setBooks(prev => 
        prev.map(book => book.id === id ? { ...book, progress, status } : book)
      );
      
      await bookService.updateBook(id, { progress, status });
      
      storageService.updateStoredBook(id, { progress, status });
      
      await refreshData();
      
      toast.success('Reading progress updated!');
    } catch (error) {
      console.error('Error updating progress:', error);
      toast.error('Failed to update progress');
      await refreshData();
    }
  };

  const toggleFavorite = async (id: string) => {
    const isRecommendation = recommendations.some(rec => rec.id === id);
    const collection = isRecommendation ? recommendations : books;
    const book = collection.find(b => b.id === id);
    
    if (book) {
      try {
        if (isRecommendation) {
          setRecommendations(prev => 
            prev.map(b => b.id === id ? { ...b, favorite: !b.favorite } : b)
          );
        } else {
          setBooks(prev => 
            prev.map(b => b.id === id ? { ...b, favorite: !b.favorite } : b)
          );
        }
        
        await bookService.updateBook(id, { favorite: !book.favorite }, isRecommendation);
        
        storageService.updateStoredBook(id, { favorite: !book.favorite }, isRecommendation);
        
        await refreshData();
        
        toast.success('Favorite status updated!');
      } catch (error) {
        console.error('Error toggling favorite:', error);
        toast.error('Failed to update favorite status');
        await refreshData();
      }
    }
  };

  const reorderBooks = async (currentOrder: string[], newOrder: string[]) => {
    try {
      const reorderedBooks = newOrder
        .map(id => books.find(book => book.id === id))
        .filter(Boolean) as Book[];
      
      setBooks(prev => {
        const booksNotInOrder = prev.filter(book => !newOrder.includes(book.id));
        return [...reorderedBooks, ...booksNotInOrder];
      });
      
      await bookService.updateBookOrder(newOrder);
      
      storageService.updateStoredBookOrder(newOrder);
      
      await refreshData();
      
      toast.success('Books reordered successfully!');
    } catch (error) {
      console.error('Error reordering books:', error);
      toast.error('Failed to reorder books');
      await refreshData();
    }
  };

  const recoverData = async () => {
    try {
      console.log('Attempting to recover data from service...');
      
      storageService.purgeTestBooks();
      
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

  useEffect(() => {
    const intervalId = setInterval(() => {
      const now = Date.now();
      const timeSinceLastRefresh = now - lastRefreshTime.current;
      
      if (timeSinceLastRefresh > 10000 && !isLoading) {
        refreshData();
      }
    }, 10000);
    
    return () => clearInterval(intervalId);
  }, [isLoading]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshData();
      }
    };
    
    const handleUserActivity = () => {
      const now = Date.now();
      const timeSinceLastRefresh = now - lastRefreshTime.current;
      
      if (timeSinceLastRefresh > 3000) {
        refreshData();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
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
      storageService.purgeTestBooks();
      recoverData();
    }
  }, [isLoading, books.length, recommendations.length]);

  return (
    <BookshelfContext.Provider value={value}>
      {children}
    </BookshelfContext.Provider>
  );
};
