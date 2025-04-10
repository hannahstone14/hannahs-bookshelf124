import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Book } from '@/types/book';
import { toast } from "sonner";
import * as bookService from '@/services/bookService';
import { isUsingDemoCredentials, shouldUseFallback } from '@/lib/supabase';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useSupabase } from '@/hooks/useSupabase';
import { createSeriesBooks } from '@/services/bookMappers';
import { v4 as uuidv4 } from 'uuid';

interface BookshelfContextType {
  books: Book[];
  addBook: (bookData: Omit<Book, 'id'>, totalSeriesBooks?: number, totalSeriesPages?: number) => void;
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
    setBooks
  } = useLocalStorageState ? localStorage : supabaseStorage;
  
  useEffect(() => {
    console.log(`BookshelfProvider initialized. Using localStorage: ${useLocalStorageState}`);
    console.log(`Current books count: ${books.length}`);
  }, [useLocalStorageState, books.length]);
  
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

  const updateLocalState = (book: Book) => {
    setBooks(prev => {
      const exists = prev.some(b => b.id === book.id);
      if (exists) {
        return prev.map(b => b.id === book.id ? book : b);
      } else {
        return [...prev, book];
      }
    });
    console.log(`Local book state updated for ID ${book.id}`);
  };

  const addBook = async (
    bookData: Omit<Book, 'id'>, 
    totalSeriesBooks?: number, 
    totalSeriesPages?: number
  ) => {
    try {
      console.log('Adding book:', bookData.title);
      
      if (bookData.isSeries && totalSeriesBooks && totalSeriesPages && totalSeriesBooks > 1) {
        const completeBook: Book = { ...bookData, id: uuidv4() };
        const tempSeriesBooks = createSeriesBooks(completeBook, totalSeriesBooks, totalSeriesPages);
        
        tempSeriesBooks.forEach(seriesBook => updateLocalState(seriesBook as Book));
        
        try {
          const addPromises = tempSeriesBooks.map(seriesBook => {
            const { id, ...bookWithoutId } = seriesBook as Book;
            return bookService.addBook(bookWithoutId);
          });
          const newBooks = await Promise.all(addPromises);
          newBooks.forEach(newBook => updateLocalState(newBook));
          toast.success(`Added ${tempSeriesBooks.length} books in the ${bookData.seriesName} series!`);
        } catch (error) {
          console.error('Error adding series books:', error);
          toast.error('Failed to add all series books');
        }
      } else {
        const tempBook: Book = { ...bookData, id: uuidv4() };
        console.log('Updating UI with temporary book:', tempBook);
        updateLocalState(tempBook);
        
        try {
          const newBook = await bookService.addBook(bookData);
          console.log('Received book from API:', newBook);
          updateLocalState(newBook);
          toast.success('Book added to your shelf!');
        } catch (error) {
          console.error('Error adding book from API:', error);
          toast.error('Failed to save book to server, but it is saved locally');
        }
      }
    } catch (error) {
      console.error('Error in addBook operation:', error);
      toast.error('Failed to add book');
    }
  };

  const removeBook = async (id: string) => {
    try {
      setBooks(prev => prev.filter(book => book.id !== id));
      await bookService.deleteBook(id);
      toast.info('Book removed from your shelf');
    } catch (error) {
      console.error('Error removing book:', error);
      toast.error('Failed to remove book');
      recoverData();
    }
  };

  const editBook = async (id: string, bookData: Partial<Book>) => {
    try {
      const currentBook = books.find(b => b.id === id);
      if (!currentBook) throw new Error(`Book with id ${id} not found`);
      
      const updatedBook = { ...currentBook, ...bookData } as Book;
      updateLocalState(updatedBook);
      
      const serverUpdatedBook = await bookService.updateBook(id, bookData);
      updateLocalState(serverUpdatedBook);
      toast.success('Book updated successfully!');
    } catch (error) {
      console.error('Error editing book:', error);
      toast.error('Failed to update book');
      recoverData();
    }
  };

  const updateProgress = async (id: string, progress: number) => {
    const status = progress === 100 ? 'read' : 'reading';
    try {
      const currentBook = books.find(b => b.id === id);
      if (!currentBook) throw new Error(`Book with id ${id} not found`);

      const duplicates = books.filter(b => 
        b.id !== id && 
        b.title === currentBook.title && 
        b.author === currentBook.author
      );
      if (duplicates.length > 0) {
        console.log(`Found ${duplicates.length} duplicate books, removing them`);
        setBooks(prev => prev.filter(book => !duplicates.some(dup => dup.id === book.id)));
        try {
          for (const dup of duplicates) {
            await bookService.deleteBook(dup.id);
          }
        } catch (deleteError) {
          console.error('Error deleting duplicate books:', deleteError);
        }
      }
      
      const updatedBook = { ...currentBook, progress, status } as Book;
      updateLocalState(updatedBook);
      await bookService.updateBook(id, { progress, status });
      toast.success('Reading progress updated!');
    } catch (error) {
      console.error('Error updating progress:', error);
      toast.error('Failed to update progress');
      recoverData();
    }
  };

  const toggleFavorite = async (id: string) => {
    try {
      const currentBook = books.find(b => b.id === id);
      if (!currentBook) throw new Error(`Book with id ${id} not found`);

      const updatedBook = { ...currentBook, favorite: !currentBook.favorite } as Book;
      updateLocalState(updatedBook);
      
      await bookService.updateBook(id, { favorite: updatedBook.favorite });
      toast.success(updatedBook.favorite ? 'Added to favorites!' : 'Removed from favorites');
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorite status');
      recoverData();
    }
  };

  const reorderBooks = async (currentOrder: string[], newOrder: string[]) => {
    const optimisticBooks = newOrder.map((id, index) => {
      const book = books.find(b => b.id === id);
      if (!book) return null;
      return { ...book, order: index };
    }).filter(Boolean) as Book[];
    
    const remainingBooks = books.filter(b => !newOrder.includes(b.id));
    setBooks([...optimisticBooks, ...remainingBooks]);

    try {
      await bookService.updateBookOrder(newOrder);
    } catch (error) {
      console.error('Error reordering books:', error);
      toast.error('Failed to save book order');
      const originalBooks = currentOrder.map((id, index) => {
        const book = books.find(b => b.id === id);
        if (!book) return null;
        return { ...book, order: index };
      }).filter(Boolean) as Book[];
      const originalRemaining = books.filter(b => !currentOrder.includes(b.id));
      setBooks([...originalBooks, ...originalRemaining]);
    }
  };

  const recoverData = async () => {
    try {
      const allBooks = await bookService.getAllBooks();
      setBooks(allBooks);
      console.log('Data recovery successful.');
    } catch (error) {
      console.error('Error recovering data:', error);
      toast.error('Failed to recover data from server.');
    }
  };

  useEffect(() => {
    const shouldRecover = (books.length === 0 && !isLoading && !initialLoadRef.current);
    
    if (shouldRecover) {
      initialLoadRef.current = true;
      console.log('No books found in state, attempting to recover data...');
      recoverData();
    }
  }, [isLoading, books.length]);

  const value = {
    books,
    addBook,
    removeBook,
    editBook,
    reorderBooks,
    updateProgress,
    toggleFavorite,
    recoverData,
    hasBackup,
    isLoading,
  };

  return <BookshelfContext.Provider value={value}>{children}</BookshelfContext.Provider>;
};
