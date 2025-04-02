
import React, { useEffect, useState } from 'react';
import Bookshelf from '@/components/Bookshelf';
import BookshelfStats from '@/components/BookshelfStats';
import { useBookshelf } from '@/context/BookshelfContext';
import { shouldUseFallback } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const { books, recommendations, recoverData, isLoading } = useBookshelf();
  const [localLoading, setLocalLoading] = useState(true);

  // Debug log on mount and ensure loading state resolves
  useEffect(() => {
    console.log(`Index page mounted. Books: ${books.length}, Recommendations: ${recommendations.length}`);
    console.log(`Using localStorage: ${shouldUseFallback()}`);
    
    // Check if books are in localStorage
    try {
      const storedBooks = localStorage.getItem('books');
      console.log(`Books in localStorage: ${storedBooks ? JSON.parse(storedBooks).length : 0}`);
      
      // If there's a mismatch between state and localStorage, recover data
      if (books.length === 0 && storedBooks && JSON.parse(storedBooks).length > 0) {
        console.log('Mismatch between state and localStorage, recovering data...');
        recoverData();
      }
      
      // Fallback for loading state in case the context never resolves
      const timer = setTimeout(() => {
        setLocalLoading(false);
        console.log('Forcing loading state to complete after timeout');
      }, 5000); // Increased timeout to ensure data has time to load
      
      return () => clearTimeout(timer);
    } catch (error) {
      console.error('Error checking localStorage:', error);
      setLocalLoading(false);
    }
  }, [books.length, recommendations.length, recoverData]); // Add dependencies to ensure recovery works properly

  // Update localLoading when the context's isLoading changes
  useEffect(() => {
    if (!isLoading) {
      setLocalLoading(false);
      console.log('Loading complete from context');
    }
  }, [isLoading]);

  // Force recovery if no data is loaded after initial render
  useEffect(() => {
    const timer = setTimeout(() => {
      if (books.length === 0 && recommendations.length === 0) {
        console.log('No data loaded after timeout, forcing recovery...');
        recoverData();
      }
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [books.length, recommendations.length, recoverData]);

  // Log re-renders
  useEffect(() => {
    console.log('Index component re-rendered');
  });

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="py-6 bg-pink-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-pink-800">This is what I read!</h1>
        </div>
      </header>
      
      <main className="flex-grow py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <BookshelfStats />
          
          {localLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-lg text-blue-600">Loading your books...</span>
            </div>
          ) : (
            <Bookshelf />
          )}
        </div>
      </main>
      
      <footer className="py-6 border-t border-gray-200 text-center text-sm text-gray-600 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <p>This is what I read!</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
