import { useState, useEffect } from 'react';
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

  // Create custom setters that immediately sync with localStorage
  const setAndSaveBooks = (newBooks: Book[] | ((prev: Book[]) => Book[])) => {
    setBooks(prev => {
      const updatedBooks = typeof newBooks === 'function' ? newBooks(prev) : newBooks;
      // Immediately save to localStorage
      try {
        localStorage.setItem('books', JSON.stringify(updatedBooks));
        console.log(`Saved ${updatedBooks.length} books to localStorage`);
      } catch (error) {
        console.error('Error saving books to localStorage:', error);
      }
      return updatedBooks;
    });
  };

  const setAndSaveRecommendations = (newRecs: Book[] | ((prev: Book[]) => Book[])) => {
    setRecommendations(prev => {
      const updatedRecs = typeof newRecs === 'function' ? newRecs(prev) : newRecs;
      // Immediately save to localStorage
      try {
        localStorage.setItem('recommendations', JSON.stringify(updatedRecs));
        console.log(`Saved ${updatedRecs.length} recommendations to localStorage`);
      } catch (error) {
        console.error('Error saving recommendations to localStorage:', error);
      }
      return updatedRecs;
    });
  };

  // Still keep the periodic sync for extra safety
  useEffect(() => {
    if (!initialized) return;
    
    const syncInterval = setInterval(() => {
      try {
        localStorage.setItem('books', JSON.stringify(books));
        localStorage.setItem('recommendations', JSON.stringify(recommendations));
        console.log(`Storage periodic save complete at ${new Date().toISOString()}: books=${books.length}, recommendations=${recommendations.length}`);
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
    }, 5000); // Changed from 15000 to 5000 ms for more frequent syncing
    
    const handleBeforeUnload = () => {
      try {
        localStorage.setItem('books', JSON.stringify(books));
        localStorage.setItem('recommendations', JSON.stringify(recommendations));
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
