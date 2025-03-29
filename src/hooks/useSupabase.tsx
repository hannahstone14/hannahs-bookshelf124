
import { useState, useEffect, useRef } from 'react';
import { Book } from '@/types/book';
import { supabase } from '@/integrations/supabase/client';
import * as bookService from '@/services/bookService';
import * as storageService from '@/services/storageService';

export const useSupabase = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [recommendations, setRecommendations] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const isMounted = useRef(true);
  const channelsRef = useRef<{ books: any; recommendations: any } | null>(null);
  const loadingAttemptsRef = useRef(0);

  // Load initial data and set up real-time subscriptions
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      
      // Maximum attempts to load data from Supabase
      const MAX_ATTEMPTS = 3;
      let booksData: Book[] = [];
      let recommendationsData: Book[] = [];
      
      try {
        // Try to load from Supabase first
        [booksData, recommendationsData] = await Promise.all([
          bookService.getAllBooks(),
          bookService.getAllRecommendations()
        ]);
        
        loadingAttemptsRef.current = 0; // Reset attempts on success
        
        if (isMounted.current) {
          setBooks(booksData);
          setRecommendations(recommendationsData);
          console.log(`Loaded ${booksData.length} books and ${recommendationsData.length} recommendations from Supabase`);
        }
      } catch (error) {
        console.error('Error loading from Supabase, attempt #', loadingAttemptsRef.current + 1, error);
        
        loadingAttemptsRef.current++;
        
        // After several attempts, try to fall back to localStorage
        if (loadingAttemptsRef.current >= MAX_ATTEMPTS) {
          console.log('Falling back to localStorage after multiple Supabase failures');
          
          // Try to load from localStorage as fallback
          booksData = storageService.getStoredBooks();
          recommendationsData = storageService.getStoredRecommendations();
          
          if (isMounted.current) {
            setBooks(booksData);
            setRecommendations(recommendationsData);
            console.log(`Loaded ${booksData.length} books and ${recommendationsData.length} recommendations from localStorage fallback`);
          }
        }
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    };
    
    loadData();
    
    // Set up real-time subscriptions if possible
    try {
      // Close any existing channels
      if (channelsRef.current) {
        if (channelsRef.current.books) {
          supabase.removeChannel(channelsRef.current.books);
        }
        if (channelsRef.current.recommendations) {
          supabase.removeChannel(channelsRef.current.recommendations);
        }
      }
      
      // Create new channels for real-time updates
      const booksChannel = supabase.channel('books-changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'books' },
          async () => {
            console.log('Real-time books update received');
            try {
              const updatedBooks = await bookService.getAllBooks();
              if (isMounted.current) {
                setBooks(updatedBooks);
              }
            } catch (error) {
              console.error('Error updating books via real-time:', error);
            }
          }
        )
        .subscribe();
        
      const recommendationsChannel = supabase.channel('recommendations-changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'recommendations' },
          async () => {
            console.log('Real-time recommendations update received');
            try {
              const updatedRecommendations = await bookService.getAllRecommendations();
              if (isMounted.current) {
                setRecommendations(updatedRecommendations);
              }
            } catch (error) {
              console.error('Error updating recommendations via real-time:', error);
            }
          }
        )
        .subscribe();
      
      channelsRef.current = {
        books: booksChannel,
        recommendations: recommendationsChannel
      };
        
      return () => {
        isMounted.current = false;
        if (channelsRef.current) {
          if (channelsRef.current.books) {
            supabase.removeChannel(channelsRef.current.books);
          }
          if (channelsRef.current.recommendations) {
            supabase.removeChannel(channelsRef.current.recommendations);
          }
        }
      };
    } catch (error) {
      console.error('Error setting up real-time subscriptions:', error);
      return () => {
        isMounted.current = false;
      };
    }
  }, []);

  return {
    books,
    setBooks,
    recommendations,
    setRecommendations,
    isLoading
  };
};
