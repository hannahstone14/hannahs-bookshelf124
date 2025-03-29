
import { useState, useEffect, useRef } from 'react';
import { Book } from '@/types/book';
import { supabase } from '@/integrations/supabase/client';
import * as bookService from '@/services/bookService';

export const useSupabase = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [recommendations, setRecommendations] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const isMounted = useRef(true);

  // Load initial data and set up real-time subscriptions
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
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    };
    
    loadData();
    
    // Set up real-time subscriptions if possible
    try {
      const channels = supabase.getChannels();
      
      // Close any existing channels
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
      
      // Create new channels for real-time updates
      const booksChannel = supabase.channel('books-changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'books' },
          async () => {
            console.log('Real-time books update received');
            const updatedBooks = await bookService.getAllBooks();
            if (isMounted.current) {
              setBooks(updatedBooks);
            }
          }
        )
        .subscribe();
        
      const recommendationsChannel = supabase.channel('recommendations-changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'recommendations' },
          async () => {
            console.log('Real-time recommendations update received');
            const updatedRecommendations = await bookService.getAllRecommendations();
            if (isMounted.current) {
              setRecommendations(updatedRecommendations);
            }
          }
        )
        .subscribe();
        
      return () => {
        isMounted.current = false;
        supabase.removeChannel(booksChannel);
        supabase.removeChannel(recommendationsChannel);
      };
    } catch (error) {
      console.error('Error setting up real-time subscriptions:', error);
    }
    
    return () => {
      isMounted.current = false;
    };
  }, []);

  return {
    books,
    setBooks,
    recommendations,
    setRecommendations,
    isLoading
  };
};
