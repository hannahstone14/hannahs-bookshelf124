import { useState, useEffect, useCallback } from 'react';
import { Book } from '@/types/book';

export const useLocalStorage = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [recommendations, setRecommendations] = useState<Book[]>([]);
  const [initialized, setInitialized] = useState<boolean>(false);

  // Load data from localStorage on initialization
  useEffect(() => {
    if (initialized) return;
    
    try {
      const storedBooks = localStorage.getItem('books');
      const storedRecommendations = localStorage.getItem('recommendations');
      
      if (storedBooks) {
        const parsedBooks = JSON.parse(storedBooks);
        setBooks(parsedBooks);
        console.log('Loaded books from localStorage:', parsedBooks.length);
      }
      
      if (storedRecommendations) {
        const parsedRecommendations = JSON.parse(storedRecommendations);
        setRecommendations(parsedRecommendations);
        console.log('Loaded recommendations from localStorage:', parsedRecommendations.length);
      }
      
      setInitialized(true);
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
  }, [initialized]);

  // Memoized function to save data to localStorage
  const saveToLocalStorage = useCallback((key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      console.log(`Saved ${data.length} items to localStorage: ${key}`);
      return true;
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error);
      return false;
    }
  }, []);

  // Create custom setters that immediately sync with localStorage
  const setAndSaveBooks = useCallback((newBooks: Book[] | ((prev: Book[]) => Book[])) => {
    setBooks(prev => {
      const updatedBooks = typeof newBooks === 'function' ? newBooks(prev) : newBooks;
      // Immediately save to localStorage
      saveToLocalStorage('books', updatedBooks);
      return updatedBooks;
    });
  }, [saveToLocalStorage]);

  const setAndSaveRecommendations = useCallback((newRecs: Book[] | ((prev: Book[]) => Book[])) => {
    setRecommendations(prev => {
      const updatedRecs = typeof newRecs === 'function' ? newRecs(prev) : newRecs;
      // Immediately save to localStorage
      saveToLocalStorage('recommendations', updatedRecs);
      return updatedRecs;
    });
  }, [saveToLocalStorage]);

  // Still keep the periodic sync for extra safety
  useEffect(() => {
    if (!initialized) return;
    
    const syncInterval = setInterval(() => {
      saveToLocalStorage('books', books);
      saveToLocalStorage('recommendations', recommendations);
    }, 3000); // Sync every 3 seconds
    
    const handleBeforeUnload = () => {
      saveToLocalStorage('books', books);
      saveToLocalStorage('recommendations', recommendations);
      console.log('Saved data before page unload');
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      clearInterval(syncInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // Save one last time on component unmount
      saveToLocalStorage('books', books);
      saveToLocalStorage('recommendations', recommendations);
    };
  }, [books, recommendations, initialized, saveToLocalStorage]);

  return {
    books,
    setBooks: setAndSaveBooks,
    recommendations,
    setRecommendations: setAndSaveRecommendations
  };
};
