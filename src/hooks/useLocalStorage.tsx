
import { useState, useEffect, useCallback, useRef } from 'react';
import { Book } from '@/types/book';

export const useLocalStorage = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [recommendations, setRecommendations] = useState<Book[]>([]);
  const [initialized, setInitialized] = useState<boolean>(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load data from localStorage on initialization
  useEffect(() => {
    if (initialized) return;
    
    try {
      console.log('Loading data from localStorage...');
      const storedBooks = localStorage.getItem('books');
      const storedRecommendations = localStorage.getItem('recommendations');
      
      if (storedBooks) {
        const parsedBooks = JSON.parse(storedBooks);
        setBooks(parsedBooks);
        console.log('Loaded books from localStorage:', parsedBooks.length);
      } else {
        console.log('No books found in localStorage');
      }
      
      if (storedRecommendations) {
        const parsedRecommendations = JSON.parse(storedRecommendations);
        setRecommendations(parsedRecommendations);
        console.log('Loaded recommendations from localStorage:', parsedRecommendations.length);
      } else {
        console.log('No recommendations found in localStorage');
      }
      
      setInitialized(true);
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      setInitialized(true); // Still mark as initialized to avoid infinite loop
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
      console.log('Setting books:', updatedBooks.length);
      // Immediately save to localStorage
      saveToLocalStorage('books', updatedBooks);
      return updatedBooks;
    });
  }, [saveToLocalStorage]);

  const setAndSaveRecommendations = useCallback((newRecs: Book[] | ((prev: Book[]) => Book[])) => {
    setRecommendations(prev => {
      const updatedRecs = typeof newRecs === 'function' ? newRecs(prev) : newRecs;
      console.log('Setting recommendations:', updatedRecs.length);
      // Immediately save to localStorage
      saveToLocalStorage('recommendations', updatedRecs);
      return updatedRecs;
    });
  }, [saveToLocalStorage]);

  // Debounced save to localStorage to prevent too many writes
  useEffect(() => {
    if (!initialized) return;
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      console.log('Periodic save to localStorage...');
      saveToLocalStorage('books', books);
      saveToLocalStorage('recommendations', recommendations);
    }, 1000); // 1 second debounce
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [books, recommendations, initialized, saveToLocalStorage]);

  // Save on unmount
  useEffect(() => {
    return () => {
      console.log('Saving data before unmount...');
      saveToLocalStorage('books', books);
      saveToLocalStorage('recommendations', recommendations);
    };
  }, [books, recommendations, saveToLocalStorage]);

  return {
    books,
    setBooks: setAndSaveBooks,
    recommendations,
    setRecommendations: setAndSaveRecommendations
  };
};
