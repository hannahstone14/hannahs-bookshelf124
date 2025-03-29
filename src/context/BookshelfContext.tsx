
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Book } from '@/types/book';
import { toast } from "sonner";
import * as bookService from '@/services/bookService';
import { isUsingDemoCredentials } from '@/lib/supabase';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useSupabase } from '@/hooks/useSupabase';

interface BookshelfContextType {
  books: Book[];
  recommendations: Book[];
  addBook: (book: Omit<Book, 'id'>) => void;
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
  const [useLocalStorageState, setUseLocalStorageState] = useState<boolean>(isUsingDemoCredentials);
  const isMounted = useRef(true);
  
  // Use either localStorage or Supabase based on configuration
  const localStorage = useLocalStorage();
  const supabaseStorage = useSupabase();
  
  // Determine which data source to use
  const { 
    books = [], 
    recommendations = [],
    setBooks,
    setRecommendations
  } = useLocalStorageState ? localStorage : supabaseStorage;
  
  // Set loading state based on Supabase loading (if applicable)
  useEffect(() => {
    if (!useLocalStorageState && 'isLoading' in supabaseStorage) {
      setIsLoading(supabaseStorage.isLoading);
    } else {
      setIsLoading(false);
    }
  }, [useLocalStorageState, supabaseStorage]);

  // Allow component to clean up on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const addBook = async (book: Omit<Book, 'id'>) => {
    try {
      const newBook = await bookService.addBook(book);
      
      if (useLocalStorage) {
        if (book.status === 'recommendation') {
          setRecommendations(prev => [...prev, newBook]);
        } else {
          setBooks(prev => [...prev, newBook]);
        }
      }
      
      if (book.status === 'recommendation') {
        toast.success('Thank you for your recommendation!');
      } else {
        toast.success('Book added to your shelf!');
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
      
      if (useLocalStorage) {
        if (isRecommendation) {
          setRecommendations(prev => prev.filter(book => book.id !== id));
        } else {
          setBooks(prev => prev.filter(book => book.id !== id));
        }
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
      
      if (useLocalStorage) {
        if (isRecommendation) {
          setRecommendations(prev => 
            prev.map(book => book.id === id ? { ...book, ...updatedBook } : book)
          );
        } else {
          setBooks(prev => 
            prev.map(book => book.id === id ? { ...book, ...updatedBook } : book)
          );
        }
      }
      
      toast.success('Book updated successfully!');
    } catch (error) {
      console.error('Error editing book:', error);
      toast.error('Failed to update book');
    }
  };

  const updateProgress = async (id: string, progress: number) => {
    try {
      const status = progress === 100 ? 'read' : 'reading';
      
      await bookService.updateBook(id, { progress, status });
      
      if (useLocalStorage) {
        setBooks(prev => 
          prev.map(book => book.id === id ? { ...book, progress, status } : book)
        );
      }
      
      toast.success('Reading progress updated!');
    } catch (error) {
      console.error('Error updating progress:', error);
      toast.error('Failed to update progress');
    }
  };

  const toggleFavorite = async (id: string) => {
    try {
      const isRecommendation = recommendations.some(rec => rec.id === id);
      const collection = isRecommendation ? recommendations : books;
      const book = collection.find(b => b.id === id);
      
      if (book) {
        await bookService.updateBook(id, { favorite: !book.favorite }, isRecommendation);
        
        if (useLocalStorage) {
          if (isRecommendation) {
            setRecommendations(prev => 
              prev.map(b => b.id === id ? { ...b, favorite: !b.favorite } : b)
            );
          } else {
            setBooks(prev => 
              prev.map(b => b.id === id ? { ...b, favorite: !b.favorite } : b)
            );
          }
        }
        
        toast.success('Favorite status updated!');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorite status');
    }
  };

  const reorderBooks = async (currentOrder: string[], newOrder: string[]) => {
    try {
      await bookService.updateBookOrder(newOrder);
      
      if (useLocalStorage) {
        const orderedBooks = newOrder.map(
          id => books.find(book => book.id === id)
        ).filter(Boolean) as Book[];
        
        const unorderedBooks = books.filter(
          book => !newOrder.includes(book.id)
        );
        
        setBooks([...orderedBooks, ...unorderedBooks]);
      }
      
      toast.success('Books reordered successfully!');
    } catch (error) {
      console.error('Error reordering books:', error);
      toast.error('Failed to reorder books');
    }
  };

  const recoverData = async () => {
    try {
      const [booksData, recommendationsData] = await Promise.all([
        bookService.getAllBooks(),
        bookService.getAllRecommendations()
      ]);
      
      if (isMounted.current) {
        setBooks(booksData);
        setRecommendations(recommendationsData);
        toast.success(`Recovered ${booksData.length} books and ${recommendationsData.length} recommendations`);
      }
    } catch (error) {
      console.error('Error recovering data:', error);
      toast.error('Failed to recover books');
    }
  };

  const value = {
    books,
    recommendations,
    addBook,
    removeBook,
    editBook,
    reorderBooks,
    updateProgress,
    toggleFavorite,
    recoverData,
    hasBackup
  };

  if (isLoading) {
    return (
      <BookshelfContext.Provider value={value}>
        {children}
      </BookshelfContext.Provider>
    );
  }

  return (
    <BookshelfContext.Provider value={value}>
      {children}
    </BookshelfContext.Provider>
  );
};
