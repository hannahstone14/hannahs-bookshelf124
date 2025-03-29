
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
  const [isSupabaseConfigured, setIsSupabaseConfigured] = useState<boolean>(true);
  
  const isMounted = useRef(true);

  // Check if Supabase is configured
  useEffect(() => {
    // Simple check - if the mock client is in use, we'll assume Supabase is not configured
    if (typeof supabase.from !== 'function' || !supabase.from('books')) {
      setIsSupabaseConfigured(false);
      console.warn('Supabase appears to be misconfigured. Using local storage fallback.');
      // Load from localStorage as fallback
      try {
        const storedBooks = localStorage.getItem('books');
        const storedRecommendations = localStorage.getItem('recommendations');
        
        if (storedBooks) {
          setBooks(JSON.parse(storedBooks));
        }
        
        if (storedRecommendations) {
          setRecommendations(JSON.parse(storedRecommendations));
        }
      } catch (error) {
        console.error('Error loading from localStorage:', error);
      }
    }
  }, []);

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
        
        // Fallback to localStorage if Supabase fails
        if (!isSupabaseConfigured) {
          try {
            const storedBooks = localStorage.getItem('books');
            const storedRecommendations = localStorage.getItem('recommendations');
            
            if (storedBooks) {
              setBooks(JSON.parse(storedBooks));
            }
            
            if (storedRecommendations) {
              setRecommendations(JSON.parse(storedRecommendations));
            }
          } catch (storageError) {
            console.error('Error loading from localStorage:', storageError);
          }
        }
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    };
    
    loadData();
    
    // Set up localStorage sync if Supabase is not configured
    if (!isSupabaseConfigured) {
      const syncInterval = setInterval(() => {
        console.log('Performing periodic save');
        try {
          console.log(`Saving ${books.length} books and ${recommendations.length} recommendations to storage`);
          localStorage.setItem('books', JSON.stringify(books));
          localStorage.setItem('recommendations', JSON.stringify(recommendations));
          console.log(`Storage save complete with timestamp: ${new Date().toISOString()} success: true`);
        } catch (error) {
          console.error('Error saving to localStorage:', error);
        }
      }, 15000); // Save every 15 seconds
      
      // Also save when the page unloads
      const handleBeforeUnload = () => {
        console.log('Page unloading, saving data');
        try {
          localStorage.setItem('books', JSON.stringify(books));
          localStorage.setItem('recommendations', JSON.stringify(recommendations));
        } catch (error) {
          console.error('Error saving to localStorage on unload:', error);
        }
      };
      
      window.addEventListener('beforeunload', handleBeforeUnload);
      
      return () => {
        clearInterval(syncInterval);
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
    
    // Set up real-time listeners for both tables if Supabase IS configured
    if (isSupabaseConfigured) {
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
    }
    
    return () => {
      isMounted.current = false;
    };
  }, [isSupabaseConfigured, books, recommendations]);

  // Add a book
  const addBook = async (book: Omit<Book, 'id'>) => {
    try {
      const newBook = await bookService.addBook(book);
      
      // If Supabase is not configured, update local state
      if (!isSupabaseConfigured) {
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

  // Remove a book
  const removeBook = async (id: string) => {
    try {
      // First determine if this is a book or recommendation
      const isRecommendation = recommendations.some(rec => rec.id === id);
      
      await bookService.deleteBook(id, isRecommendation);
      
      // If Supabase is not configured, update local state
      if (!isSupabaseConfigured) {
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

  // Edit a book
  const editBook = async (id: string, bookData: Partial<Book>) => {
    try {
      // Determine if this is a book or recommendation
      const isRecommendation = recommendations.some(rec => rec.id === id);
      
      const updatedBook = await bookService.updateBook(id, bookData, isRecommendation);
      
      // If Supabase is not configured, update local state
      if (!isSupabaseConfigured) {
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

  // Update reading progress
  const updateProgress = async (id: string, progress: number) => {
    try {
      // Update progress and status based on progress
      const status = progress === 100 ? 'read' : 'reading';
      
      await bookService.updateBook(id, { progress, status });
      
      // If Supabase is not configured, update local state
      if (!isSupabaseConfigured) {
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

  // Toggle favorite status
  const toggleFavorite = async (id: string) => {
    try {
      // Determine if this is a book or recommendation
      const isRecommendation = recommendations.some(rec => rec.id === id);
      const collection = isRecommendation ? recommendations : books;
      const book = collection.find(b => b.id === id);
      
      if (book) {
        await bookService.updateBook(id, { favorite: !book.favorite }, isRecommendation);
        
        // If Supabase is not configured, update local state
        if (!isSupabaseConfigured) {
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

  // Reorder books
  const reorderBooks = async (currentOrder: string[], newOrder: string[]) => {
    try {
      await bookService.updateBookOrder(newOrder);
      
      // If Supabase is not configured, update local state with the new order
      if (!isSupabaseConfigured) {
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
