import { useState, useEffect } from 'react';
import { Book } from '@/types/book';
import { isTestBook } from '@/lib/supabase';
import { purgeTestBooks } from '@/services/storageService';

export const useLocalStorage = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [recommendations, setRecommendations] = useState<Book[]>([]);
  const [initialized, setInitialized] = useState<boolean>(false);

  // Load data from localStorage on initialization
  useEffect(() => {
    if (initialized) return;
    
    try {
      // First purge any test books that might exist
      purgeTestBooks();
      
      const storedBooks = localStorage.getItem('books');
      const storedRecommendations = localStorage.getItem('recommendations');
      
      if (storedBooks) {
        try {
          const parsedBooks = JSON.parse(storedBooks);
          // Extra safety filter
          const filteredBooks = parsedBooks.filter((b: Book) => !isTestBook(b));
          setBooks(filteredBooks);
          console.log('Loaded books from localStorage:', filteredBooks.length);
        } catch (e) {
          console.error('Error parsing books from localStorage:', e);
          // Reset to empty array on parse error
          localStorage.setItem('books', JSON.stringify([]));
          setBooks([]);
        }
      }
      
      if (storedRecommendations) {
        try {
          const parsedRecommendations = JSON.parse(storedRecommendations);
          // Extra safety filter
          const filteredRecs = parsedRecommendations.filter((b: Book) => !isTestBook(b));
          setRecommendations(filteredRecs);
          console.log('Loaded recommendations from localStorage:', filteredRecs.length);
        } catch (e) {
          console.error('Error parsing recommendations from localStorage:', e);
          // Reset to empty array on parse error
          localStorage.setItem('recommendations', JSON.stringify([]));
          setRecommendations([]);
        }
      }
      
      setInitialized(true);
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      // Set to initialized to prevent infinite retries
      setInitialized(true);
    }
  }, [initialized]);

  // Create custom setters that immediately sync with localStorage
  const setAndSaveBooks = (newBooks: Book[] | ((prev: Book[]) => Book[])) => {
    setBooks(prev => {
      const updatedBooks = typeof newBooks === 'function' ? newBooks(prev) : newBooks;
      
      // Extra safety filter
      const filteredBooks = updatedBooks.filter(book => !isTestBook(book));
      
      // Immediately save to localStorage
      try {
        localStorage.setItem('books', JSON.stringify(filteredBooks));
        console.log(`Saved ${filteredBooks.length} books to localStorage`);
      } catch (error) {
        console.error('Error saving books to localStorage:', error);
      }
      return filteredBooks;
    });
  };

  const setAndSaveRecommendations = (newRecs: Book[] | ((prev: Book[]) => Book[])) => {
    setRecommendations(prev => {
      const updatedRecs = typeof newRecs === 'function' ? newRecs(prev) : newRecs;
      
      // Extra safety filter
      const filteredRecs = updatedRecs.filter(book => !isTestBook(book));
      
      // Immediately save to localStorage
      try {
        localStorage.setItem('recommendations', JSON.stringify(filteredRecs));
        console.log(`Saved ${filteredRecs.length} recommendations to localStorage`);
      } catch (error) {
        console.error('Error saving recommendations to localStorage:', error);
      }
      return filteredRecs;
    });
  };

  // Still keep the periodic sync for extra safety
  useEffect(() => {
    if (!initialized) return;
    
    const syncInterval = setInterval(() => {
      try {
        // Filter and save books
        const filteredBooks = books.filter(book => !isTestBook(book));
        localStorage.setItem('books', JSON.stringify(filteredBooks));
        
        // Filter and save recommendations
        const filteredRecs = recommendations.filter(book => !isTestBook(book));
        localStorage.setItem('recommendations', JSON.stringify(filteredRecs));
        
        console.log(`Storage periodic save complete at ${new Date().toISOString()}: books=${filteredBooks.length}, recommendations=${filteredRecs.length}`);
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
    }, 5000); // 5000 ms for frequent syncing
    
    const handleBeforeUnload = () => {
      try {
        // Filter and save books
        const filteredBooks = books.filter(book => !isTestBook(book));
        localStorage.setItem('books', JSON.stringify(filteredBooks));
        
        // Filter and save recommendations
        const filteredRecs = recommendations.filter(book => !isTestBook(book));
        localStorage.setItem('recommendations', JSON.stringify(filteredRecs));
        
        console.log('Saved data before page unload');
      } catch (error) {
        console.error('Error saving to localStorage on unload:', error);
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      clearInterval(syncInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [books, recommendations, initialized]);

  return {
    books,
    setBooks: setAndSaveBooks,
    recommendations,
    setRecommendations: setAndSaveRecommendations
  };
};
