
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
  recommendations: Book[];
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

  const updateLocalState = (book: Book, isRecommendation: boolean) => {
    if (isRecommendation) {
      setRecommendations(prev => {
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
    
    console.log(`Local state updated: ${isRecommendation ? 'recommendation' : 'book'} with ID ${book.id}`);
  };

  const addBook = async (
    bookData: Omit<Book, 'id'>, 
    totalSeriesBooks?: number, 
    totalSeriesPages?: number
  ) => {
    try {
      console.log('Adding book:', bookData.title);
      
      if (bookData.isSeries && totalSeriesBooks && totalSeriesPages && totalSeriesBooks > 1) {
        // For UI updates, we need a complete book with ID
        const completeBook: Book = {
          ...bookData,
          id: uuidv4()
        };
        
        const tempSeriesBooks = createSeriesBooks(completeBook, totalSeriesBooks, totalSeriesPages);
        
        // Update UI with temporary books (these have IDs)
        tempSeriesBooks.forEach(seriesBook => {
          updateLocalState(seriesBook as Book, bookData.status === 'recommendation');
        });
        
        try {
          // When sending to API, we need to remove the ID and use Omit<Book, "id"> type
          const addPromises = tempSeriesBooks.map(seriesBook => {
            // Create a proper Omit<Book, "id"> by removing the id property
            const { id, ...bookWithoutId } = seriesBook as Book;
            return bookService.addBook(bookWithoutId);
          });
          
          const newBooks = await Promise.all(addPromises);
          
          // Update UI with books returned from API (these have server-generated IDs)
          newBooks.forEach(newBook => {
            updateLocalState(newBook, bookData.status === 'recommendation');
          });
          
          toast.success(`Added ${tempSeriesBooks.length} books in the ${bookData.seriesName} series!`);
        } catch (error) {
          console.error('Error adding series books:', error);
          toast.error('Failed to add all series books');
        }
      } else {
        // For UI updates, create a complete book with ID
        const tempBook: Book = {
          ...bookData,
          id: uuidv4(),
        };
        
        console.log('Updating UI with temporary book:', tempBook);
        updateLocalState(tempBook, bookData.status === 'recommendation');
        
        try {
          // When sending to API, pass bookData which is already Omit<Book, "id">
          const newBook = await bookService.addBook(bookData);
          
          console.log('Received book from API:', newBook);
          updateLocalState(newBook, bookData.status === 'recommendation');
          
          if (bookData.status === 'recommendation') {
            toast.success('Thank you for your recommendation!');
          } else {
            toast.success('Book added to your shelf!');
          }
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
      const isRecommendation = recommendations.some(rec => rec.id === id);
      
      if (isRecommendation) {
        setRecommendations(prev => prev.filter(book => book.id !== id));
      } else {
        setBooks(prev => prev.filter(book => book.id !== id));
      }
      
      await bookService.deleteBook(id, isRecommendation);
      
      toast.info(isRecommendation ? 'Recommendation removed' : 'Book removed from your shelf');
    } catch (error) {
      console.error('Error removing book:', error);
      toast.error('Failed to remove book');
      
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
      
      const updatedBook = { ...currentBook, ...bookData } as Book;
      updateLocalState(updatedBook, isRecommendation);
      
      const serverUpdatedBook = await bookService.updateBook(id, bookData, isRecommendation);
      
      updateLocalState(serverUpdatedBook, isRecommendation);
      
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
      if (!currentBook) {
        throw new Error(`Book with id ${id} not found`);
      }
      
      const updatedBook = { ...currentBook, progress, status } as Book;
      updateLocalState(updatedBook, false);
      
      await bookService.updateBook(id, { progress, status });
      
      toast.success('Reading progress updated!');
    } catch (error) {
      console.error('Error updating progress:', error);
      toast.error('Failed to update progress');
      
      recoverData();
    }
  };

  const toggleFavorite = async (id: string) => {
    const isRecommendation = recommendations.some(rec => rec.id === id);
    const collection = isRecommendation ? recommendations : books;
    const book = collection.find(b => b.id === id);
    
    if (book) {
      try {
        const updatedBook = { ...book, favorite: !book.favorite } as Book;
        updateLocalState(updatedBook, isRecommendation);
        
        await bookService.updateBook(id, { favorite: !book.favorite }, isRecommendation);
        
        toast.success('Favorite status updated!');
      } catch (error) {
        console.error('Error toggling favorite:', error);
        toast.error('Failed to update favorite status');
        
        recoverData();
      }
    }
  };

  const reorderBooks = async (currentOrder: string[], newOrder: string[]) => {
    try {
      console.log('Reordering books, current order:', currentOrder, 'new order:', newOrder);
      
      setBooks(prev => {
        const booksCopy = [...prev];
        const booksMap = new Map(booksCopy.map(book => [book.id, book]));
        
        const orderedBooks = newOrder
          .filter(id => booksMap.has(id))
          .map(id => booksMap.get(id)!)
          .map((book, index) => ({...book, order: index}));
        
        const unorderedBooks = booksCopy.filter(book => !newOrder.includes(book.id));
        
        const result = [...orderedBooks, ...unorderedBooks];
        console.log('Locally reordered books:', result.length);
        return result;
      });
      
      await bookService.updateBookOrder(newOrder);
      
      toast.success('Books reordered successfully!');
    } catch (error) {
      console.error('Error reordering books:', error);
      toast.error('Failed to reorder books');
      
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
