
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
  isLoading: boolean;
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
  const initialLoadRef = useRef(false);
  
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

  // New function to update local state immediately without waiting for service response
  const updateLocalState = (book: Book, isRecommendation: boolean) => {
    if (isRecommendation) {
      setRecommendations(prev => {
        // Check if book already exists and update it, otherwise add it
        const exists = prev.some(b => b.id === book.id);
        if (exists) {
          return prev.map(b => b.id === book.id ? book : b);
        } else {
          return [...prev, book];
        }
      });
    } else {
      setBooks(prev => {
        const exists = prev.some(b => b.id === book.id);
        if (exists) {
          return prev.map(b => b.id === book.id ? book : b);
        } else {
          return [...prev, book];
        }
      });
    }
  };

  const addBook = async (
    book: Omit<Book, 'id'>, 
    totalSeriesBooks?: number, 
    totalSeriesPages?: number
  ) => {
    try {
      console.log('Adding book:', book.title);
      
      if (book.isSeries && totalSeriesBooks && totalSeriesPages && totalSeriesBooks > 1) {
        const seriesBooks = createSeriesBooks(book, totalSeriesBooks, totalSeriesPages);
        
        // Update UI immediately before API call for better UX
        seriesBooks.forEach(seriesBook => {
          updateLocalState(seriesBook, book.status === 'recommendation');
        });
        
        const addPromises = seriesBooks.map(seriesBook => bookService.addBook(seriesBook));
        const newBooks = await Promise.all(addPromises);
        
        // Update again with the response from the server
        newBooks.forEach(newBook => {
          updateLocalState(newBook, book.status === 'recommendation');
        });
        
        toast.success(`Added ${seriesBooks.length} books in the ${book.seriesName} series!`);
      } else {
        // Create a temporary ID for immediate UI update
        const tempBook = {
          ...book,
          id: crypto.randomUUID(),
        } as Book;
        
        // Update UI immediately
        updateLocalState(tempBook, book.status === 'recommendation');
        
        // Then make the actual API call
        const newBook = await bookService.addBook(book);
        
        // Update with the server response 
        updateLocalState(newBook, book.status === 'recommendation');
        
        if (book.status === 'recommendation') {
          toast.success('Thank you for your recommendation!');
        } else {
          toast.success('Book added to your shelf!');
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
      
      // Update UI immediately
      if (isRecommendation) {
        setRecommendations(prev => prev.filter(book => book.id !== id));
      } else {
        setBooks(prev => prev.filter(book => book.id !== id));
      }
      
      // Then make the API call
      await bookService.deleteBook(id, isRecommendation);
      
      toast.info(isRecommendation ? 'Recommendation removed' : 'Book removed from your shelf');
    } catch (error) {
      console.error('Error removing book:', error);
      toast.error('Failed to remove book');
      
      // Recover on error by reloading data
      recoverData();
    }
  };

  const editBook = async (id: string, bookData: Partial<Book>) => {
    try {
      const isRecommendation = recommendations.some(rec => rec.id === id);
      const currentCollection = isRecommendation ? recommendations : books;
      const currentBook = currentCollection.find(b => b.id === id);
      
      if (!currentBook) {
        throw new Error(`Book with id ${id} not found`);
      }
      
      // Update UI immediately with optimistic update
      const updatedBook = { ...currentBook, ...bookData } as Book;
      updateLocalState(updatedBook, isRecommendation);
      
      // Then make the API call
      const serverUpdatedBook = await bookService.updateBook(id, bookData, isRecommendation);
      
      // Update again with server response
      updateLocalState(serverUpdatedBook, isRecommendation);
      
      toast.success('Book updated successfully!');
    } catch (error) {
      console.error('Error editing book:', error);
      toast.error('Failed to update book');
      
      // Recover on error
      recoverData();
    }
  };

  const updateProgress = async (id: string, progress: number) => {
    const status = progress === 100 ? 'read' : 'reading';
    
    try {
      // Find current book
      const currentBook = books.find(b => b.id === id);
      if (!currentBook) {
        throw new Error(`Book with id ${id} not found`);
      }
      
      // Update UI immediately
      const updatedBook = { ...currentBook, progress, status } as Book;
      updateLocalState(updatedBook, false);
      
      // Then make the API call
      await bookService.updateBook(id, { progress, status });
      
      toast.success('Reading progress updated!');
    } catch (error) {
      console.error('Error updating progress:', error);
      toast.error('Failed to update progress');
      
      // Recover on error
      recoverData();
    }
  };

  const toggleFavorite = async (id: string) => {
    const isRecommendation = recommendations.some(rec => rec.id === id);
    const collection = isRecommendation ? recommendations : books;
    const book = collection.find(b => b.id === id);
    
    if (book) {
      try {
        // Update UI immediately
        const updatedBook = { ...book, favorite: !book.favorite } as Book;
        updateLocalState(updatedBook, isRecommendation);
        
        // Then make the API call
        await bookService.updateBook(id, { favorite: !book.favorite }, isRecommendation);
        
        toast.success('Favorite status updated!');
      } catch (error) {
        console.error('Error toggling favorite:', error);
        toast.error('Failed to update favorite status');
        
        // Recover on error
        recoverData();
      }
    }
  };

  const reorderBooks = async (currentOrder: string[], newOrder: string[]) => {
    try {
      // First reorder locally for immediate feedback
      const orderedBooks = newOrder.map(
        id => books.find(book => book.id === id)
      ).filter(Boolean) as Book[];
      
      const unorderedBooks = books.filter(
        book => !newOrder.includes(book.id)
      );
      
      setBooks([...orderedBooks, ...unorderedBooks]);
      
      // Then make the API call
      await bookService.updateBookOrder(newOrder);
      
      toast.success('Books reordered successfully!');
    } catch (error) {
      console.error('Error reordering books:', error);
      toast.error('Failed to reorder books');
      
      // Recover on error
      recoverData();
    }
  };

  const recoverData = async () => {
    try {
      setIsLoading(true);
      console.log('Attempting to recover data from service...');
      const [booksData, recommendationsData] = await Promise.all([
        bookService.getAllBooks(),
        bookService.getAllRecommendations()
      ]);
      
      if (isMounted.current) {
        console.log(`Recovered ${booksData.length} books and ${recommendationsData.length} recommendations`);
        setBooks(booksData);
        setRecommendations(recommendationsData);
        if (booksData.length > 0 || recommendationsData.length > 0) {
          toast.success(`Recovered ${booksData.length} books and ${recommendationsData.length} recommendations`);
        }
      }
    } catch (error) {
      console.error('Error recovering data:', error);
      toast.error('Failed to recover books');
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  };

  // On initial mount, try to load data if state is empty
  useEffect(() => {
    const shouldRecover = (books.length === 0 && recommendations.length === 0 && !isLoading && !initialLoadRef.current);
    
    if (shouldRecover) {
      initialLoadRef.current = true;
      console.log('No books found in state, attempting to recover data...');
      recoverData();
    }
  }, [isLoading, books.length, recommendations.length]);

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
    isLoading
  };

  return (
    <BookshelfContext.Provider value={value}>
      {children}
    </BookshelfContext.Provider>
  );
};
