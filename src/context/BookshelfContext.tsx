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
  const [hasBackup, setHasBackup] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSupabaseConfigured, setIsSupabaseConfigured] = useState<boolean>(true);
  const isMounted = useRef(true);

  useEffect(() => {
    if (typeof supabase.from !== 'function' || !supabase.from('books')) {
      setIsSupabaseConfigured(false);
      console.warn('Supabase appears to be misconfigured. Using local storage fallback.');
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
      }, 15000);
      
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
    
    if (isSupabaseConfigured) {
      try {
        let booksSubscription: any = null;
        let recommendationsSubscription: any = null;
        
        if (typeof supabase.channel === 'function') {
          try {
            booksSubscription = supabase.channel('books-changes');
            if (booksSubscription && typeof booksSubscription.on === 'function') {
              booksSubscription = booksSubscription.on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'books' },
                async () => {
                  console.log('Real-time books update received');
                  const updatedBooks = await bookService.getAllBooks();
                  if (isMounted.current) {
                    setBooks(updatedBooks);
                  }
                }
              ).subscribe();
            }
            
            recommendationsSubscription = supabase.channel('recommendations-changes');
            if (recommendationsSubscription && typeof recommendationsSubscription.on === 'function') {
              recommendationsSubscription = recommendationsSubscription.on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'recommendations' },
                async () => {
                  console.log('Real-time recommendations update received');
                  const updatedRecommendations = await bookService.getAllRecommendations();
                  if (isMounted.current) {
                    setRecommendations(updatedRecommendations);
                  }
                }
              ).subscribe();
            }
          } catch (subError) {
            console.error('Error setting up real-time subscriptions:', subError);
          }
        }
        
        return () => {
          isMounted.current = false;
          if (booksSubscription && typeof booksSubscription.unsubscribe === 'function') {
            booksSubscription.unsubscribe();
          }
          if (recommendationsSubscription && typeof recommendationsSubscription.unsubscribe === 'function') {
            recommendationsSubscription.unsubscribe();
          }
        };
      } catch (error) {
        console.error('Error setting up real-time subscriptions:', error);
      }
    }
    
    return () => {
      isMounted.current = false;
    };
  }, [isSupabaseConfigured, books, recommendations]);

  const addBook = async (book: Omit<Book, 'id'>) => {
    try {
      const newBook = await bookService.addBook(book);
      
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

  const removeBook = async (id: string) => {
    try {
      const isRecommendation = recommendations.some(rec => rec.id === id);
      
      await bookService.deleteBook(id, isRecommendation);
      
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

  const editBook = async (id: string, bookData: Partial<Book>) => {
    try {
      const isRecommendation = recommendations.some(rec => rec.id === id);
      
      const updatedBook = await bookService.updateBook(id, bookData, isRecommendation);
      
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

  const updateProgress = async (id: string, progress: number) => {
    try {
      const status = progress === 100 ? 'read' : 'reading';
      
      await bookService.updateBook(id, { progress, status });
      
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

  const toggleFavorite = async (id: string) => {
    try {
      const isRecommendation = recommendations.some(rec => rec.id === id);
      const collection = isRecommendation ? recommendations : books;
      const book = collection.find(b => b.id === id);
      
      if (book) {
        await bookService.updateBook(id, { favorite: !book.favorite }, isRecommendation);
        
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

  const reorderBooks = async (currentOrder: string[], newOrder: string[]) => {
    try {
      await bookService.updateBookOrder(newOrder);
      
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
