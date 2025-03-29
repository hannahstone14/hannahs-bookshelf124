import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Book } from '@/types/book';
import { toast } from "sonner";
import * as bookService from '@/services/bookService';
import { supabase } from '@/lib/supabase';

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
  const [books, setBooks] = useState<Book[]>([]);
  const [recommendations, setRecommendations] = useState<Book[]>([]);
  const [hasBackup, setHasBackup] = useState<boolean>(true); // Always true with Supabase
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  const isMounted = useRef(true);

  // Initial data load from Supabase
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [booksData, recommendationsData] = await Promise.all([
          bookService.getAllBooks(),
          bookService.getAllRecommendations()
        ]);
        
        if (isMounted.current) {
          setBooks(booksData);
          setRecommendations(recommendationsData);
          console.log(`Loaded ${booksData.length} books and ${recommendationsData.length} recommendations from Supabase`);
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
        toast.error('Failed to load your books');
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    };
    
    loadData();
    
    // Set up real-time listeners for both tables
    const booksSubscription = supabase
      .channel('books-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'books' 
      }, async (payload) => {
        console.log('Real-time books update:', payload);
        // Reload all books to ensure we have the latest state
        const updatedBooks = await bookService.getAllBooks();
        if (isMounted.current) {
          setBooks(updatedBooks);
        }
      })
      .subscribe();
      
    const recommendationsSubscription = supabase
      .channel('recommendations-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'recommendations' 
      }, async (payload) => {
        console.log('Real-time recommendations update:', payload);
        // Reload all recommendations
        const updatedRecommendations = await bookService.getAllRecommendations();
        if (isMounted.current) {
          setRecommendations(updatedRecommendations);
        }
      })
      .subscribe();
    
    return () => {
      isMounted.current = false;
      // Clean up subscriptions
      supabase.removeChannel(booksSubscription);
      supabase.removeChannel(recommendationsSubscription);
    };
  }, []);

  // Add a book
  const addBook = async (book: Omit<Book, 'id'>) => {
    try {
      const newBook = await bookService.addBook(book);
      
      if (book.status === 'recommendation') {
        toast.success('Thank you for your recommendation!');
      } else {
        toast.success('Book added to your shelf!');
      }
      
      // State will be updated by the real-time subscription
    } catch (error) {
      console.error('Error adding book:', error);
      toast.error('Failed to add book');
    }
  };

  // Remove a book
  const removeBook = async (id: string) => {
    try {
      // First determine if this is a book or recommendation
      const isRecommendation = recommendations.some(rec => rec.id === id);
      
      await bookService.deleteBook(id, isRecommendation);
      
      toast.info(isRecommendation ? 'Recommendation removed' : 'Book removed from your shelf');
      
      // State will be updated by the real-time subscription
    } catch (error) {
      console.error('Error removing book:', error);
      toast.error('Failed to remove book');
    }
  };

  // Edit a book
  const editBook = async (id: string, bookData: Partial<Book>) => {
    try {
      // Determine if this is a book or recommendation
      const isRecommendation = recommendations.some(rec => rec.id === id);
      
      await bookService.updateBook(id, bookData, isRecommendation);
      
      toast.success('Book updated successfully!');
      
      // State will be updated by the real-time subscription
    } catch (error) {
      console.error('Error editing book:', error);
      toast.error('Failed to update book');
    }
  };

  // Update reading progress
  const updateProgress = async (id: string, progress: number) => {
    try {
      // Update progress and status based on progress
      const status = progress === 100 ? 'read' : 'reading';
      
      await bookService.updateBook(id, { progress, status });
      
      toast.success('Reading progress updated!');
      
      // State will be updated by the real-time subscription
    } catch (error) {
      console.error('Error updating progress:', error);
      toast.error('Failed to update progress');
    }
  };

  // Toggle favorite status
  const toggleFavorite = async (id: string) => {
    try {
      // Determine if this is a book or recommendation
      const isRecommendation = recommendations.some(rec => rec.id === id);
      const collection = isRecommendation ? recommendations : books;
      const book = collection.find(b => b.id === id);
      
      if (book) {
        await bookService.updateBook(id, { favorite: !book.favorite }, isRecommendation);
        
        toast.success('Favorite status updated!');
        
        // State will be updated by the real-time subscription
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorite status');
    }
  };

  // Reorder books
  const reorderBooks = async (currentOrder: string[], newOrder: string[]) => {
    try {
      await bookService.updateBookOrder(newOrder);
      
      toast.success('Books reordered successfully!');
      
      // State will be updated by the real-time subscription
    } catch (error) {
      console.error('Error reordering books:', error);
      toast.error('Failed to reorder books');
    }
  };

  // Recovery function (not really needed with Supabase, but keeping for API compatibility)
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

  // Return the context value
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

  // Show loading state if we're still loading initial data
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
