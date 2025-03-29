
import { useState, useEffect } from 'react';
import { Book } from '@/types/book';

export const useLocalStorage = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [recommendations, setRecommendations] = useState<Book[]>([]);

  // Load data from localStorage on initialization
  useEffect(() => {
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
  }, []);

  // Save data to localStorage when it changes
  useEffect(() => {
    const syncInterval = setInterval(() => {
      console.log('Performing periodic save');
      try {
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
  }, [books, recommendations]);

  return {
    books,
    setBooks,
    recommendations,
    setRecommendations
  };
};
