
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Book } from '@/types/book';
import { toast } from "sonner";
import * as bookService from '@/services/bookService';
import { isUsingDemoCredentials, shouldUseFallback } from '@/lib/supabase';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useSupabase } from '@/hooks/useSupabase';
import { createSeriesBooks } from '@/services/bookMappers';

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
  refreshData: () => Promise<void>; // Add a function to manually refresh data
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
  
  const { 
    books = [], 
    recommendations = [],
    setBooks,
    setRecommendations
  } = useLocalStorageState ? localStorage : supabaseStorage;
  
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

  // Add a function to manually refresh data
  const refreshData = async () => {
    try {
      setIsLoading(true);
      console.log('Manually refreshing data...');
      const [booksData, recommendationsData] = await Promise.all([
        bookService.getAllBooks(),
        bookService.getAllRecommendations()
      ]);
      
      if (isMounted.current) {
        console.log(`Refreshed data: ${booksData.length} books and ${recommendationsData.length} recommendations`);
        setBooks(booksData);
        setRecommendations(recommendationsData);
        lastRefreshTime.current = Date.now();
        toast.success('Data refreshed successfully');
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error('Failed to refresh data');
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
            setRecommendations(prev => [...prev, ...newBooks]);
          } else {
            setBooks(prev => [...prev, ...newBooks]);
          }
        }
        
        toast.success(`Added ${seriesBooks.length} books in the ${book.seriesName} series!`);
        
        // Refresh data after adding series books
        await refreshData();
      } else {
        const newBook = await bookService.addBook(bookWithSeriesData);
        
        if (useLocalStorageState) {
          if (book.status === 'recommendation') {
            setRecommendations(prev => [...prev, newBook]);
          } else {
            setBooks(prev => [...prev, newBook]);
          }
          console.log(`Book added successfully. New count: ${book.status === 'recommendation' ? recommendations.length + 1 : books.length + 1}`);
        }
        
        if (book.status === 'recommendation') {
          toast.success('Thank you for your recommendation!');
        } else {
          toast.success('Book added to your shelf!');
        }
        
        // Refresh data after adding a book
        if (!useLocalStorageState) {
          await refreshData();
        }
      }
    } catch (error) {
      console.error('Error adding book:', error);
      toast.error('Failed to add book');
    }
  };

  const removeBook = async (id: string) => {
    try {
      const isRecommendation = recommendations.some(rec => rec.id === id);
      
      await bookService.deleteBook(id, isRecommendation);
      
      if (useLocalStorageState) {
        if (isRecommendation) {
          setRecommendations(prev => prev.filter(book => book.id !== id));
        } else {
          setBooks(prev => prev.filter(book => book.id !== id));
        }
      } else {
        // Always refresh data after removing a book when using Supabase
        await refreshData();
      }
      
      toast.info(isRecommendation ? 'Recommendation removed' : 'Book removed from your shelf');
    } catch (error) {
      console.error('Error removing book:', error);
      toast.error('Failed to remove book');
    }
  };

  const editBook = async (id: string, bookData: Partial<Book>) => {
    try {
      const isRecommendation = recommendations.some(rec => rec.id === id);
      
      const updatedBook = await bookService.updateBook(id, bookData, isRecommendation);
      
      if (useLocalStorageState) {
        if (isRecommendation) {
          setRecommendations(prev => 
            prev.map(book => book.id === id ? { ...book, ...updatedBook } : book)
          );
        } else {
          setBooks(prev => 
            prev.map(book => book.id === id ? { ...book, ...updatedBook } : book)
          );
        }
      } else {
        // Always refresh data after editing a book when using Supabase
        await refreshData();
      }
      
      toast.success('Book updated successfully!');
    } catch (error) {
      console.error('Error editing book:', error);
      toast.error('Failed to update book');
      
      // Try to refresh data if there was an error
      if (!useLocalStorageState) {
        await refreshData();
      }
    }
  };

  const updateProgress = async (id: string, progress: number) => {
    const status = progress === 100 ? 'read' : 'reading';
    
    try {
      await bookService.updateBook(id, { progress, status });
      
      if (useLocalStorageState) {
        setBooks(prev => 
          prev.map(book => book.id === id ? { ...book, progress, status } : book)
        );
      } else {
        // Always refresh data after updating progress when using Supabase
        await refreshData();
      }
      
      toast.success('Reading progress updated!');
    } catch (error) {
      console.error('Error updating progress:', error);
      toast.error('Failed to update progress');
    }
  };

  const toggleFavorite = async (id: string) => {
    const isRecommendation = recommendations.some(rec => rec.id === id);
    const collection = isRecommendation ? recommendations : books;
    const book = collection.find(b => b.id === id);
    
    if (book) {
      try {
        await bookService.updateBook(id, { favorite: !book.favorite }, isRecommendation);
        
        if (useLocalStorageState) {
          if (isRecommendation) {
            setRecommendations(prev => 
              prev.map(b => b.id === id ? { ...b, favorite: !b.favorite } : b)
            );
          } else {
            setBooks(prev => 
              prev.map(b => b.id === id ? { ...b, favorite: !b.favorite } : b)
            );
          }
        } else {
          // Always refresh data after toggling favorite when using Supabase
          await refreshData();
        }
        
        toast.success('Favorite status updated!');
      } catch (error) {
        console.error('Error toggling favorite:', error);
        toast.error('Failed to update favorite status');
      }
    }
  };

  const reorderBooks = async (currentOrder: string[], newOrder: string[]) => {
    try {
      await bookService.updateBookOrder(newOrder);
      
      if (useLocalStorageState) {
        const orderedBooks = newOrder.map(
          id => books.find(book => book.id === id)
        ).filter(Boolean) as Book[];
        
        const unorderedBooks = books.filter(
          book => !newOrder.includes(book.id)
        );
        
        setBooks([...orderedBooks, ...unorderedBooks]);
      } else {
        // Always refresh data after reordering books when using Supabase
        await refreshData();
      }
      
      toast.success('Books reordered successfully!');
    } catch (error) {
      console.error('Error reordering books:', error);
      toast.error('Failed to reorder books');
    }
  };

  const recoverData = async () => {
    try {
      console.log('Attempting to recover data from service...');
      const [booksData, recommendationsData] = await Promise.all([
        bookService.getAllBooks(),
        bookService.getAllRecommendations()
      ]);
      
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

  // Add auto-refresh every 30 seconds when using Supabase
  useEffect(() => {
    if (useLocalStorageState) return;
    
    const intervalId = setInterval(() => {
      const now = Date.now();
      const timeSinceLastRefresh = now - lastRefreshTime.current;
      
      // Only refresh if it's been more than 30 seconds since the last refresh
      if (timeSinceLastRefresh > 30000 && !isLoading) {
        console.log('Auto-refreshing data...');
        refreshData();
      }
    }, 30000);
    
    return () => clearInterval(intervalId);
  }, [useLocalStorageState, isLoading]);

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
    hasBackup,
    refreshData
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
