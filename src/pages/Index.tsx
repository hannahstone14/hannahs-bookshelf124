
import React, { useEffect, useState } from 'react';
import Bookshelf from '@/components/Bookshelf';
import BookshelfStats from '@/components/BookshelfStats';
import { useBookshelf } from '@/context/BookshelfContext';
import { shouldUseFallback } from '@/lib/supabase';
import * as storageService from '@/services/storageService';
import { toast } from 'sonner';

const Index = () => {
  const { books, recommendations, recoverData } = useBookshelf();
  const [dataRecovered, setDataRecovered] = useState(false);

  // Initialize and verify data on mount
  useEffect(() => {
    console.log(`Index page loaded. Books: ${books.length}, Recommendations: ${recommendations.length}`);
    console.log(`Using localStorage: ${shouldUseFallback()}`);
    
    // Make sure test books are removed
    storageService.purgeTestBooks();
    
    // Attempt data recovery on initial load
    const attemptRecovery = async () => {
      try {
        // Check if books are in localStorage
        const storedBooks = localStorage.getItem('books');
        const bookCount = storedBooks ? JSON.parse(storedBooks).length : 0;
        console.log(`Books in localStorage: ${bookCount}`);
        
        // Always attempt recovery on first load to ensure we have the latest data
        if (!dataRecovered) {
          console.log('Attempting data recovery...');
          await recoverData();
          setDataRecovered(true);
          
          // If we have books in localStorage but none in state, show a message
          if (bookCount > 0 && books.length === 0) {
            toast.info(`Restored ${bookCount} books from storage`);
          }
        }
      } catch (error) {
        console.error('Error during data recovery:', error);
      }
    };
    
    attemptRecovery();
    
    // Set up an interval to periodically check if books disappeared and recover them
    const recoveryInterval = setInterval(() => {
      const storedBooks = localStorage.getItem('books');
      const bookCount = storedBooks ? JSON.parse(storedBooks).length : 0;
      
      if (books.length === 0 && bookCount > 0) {
        console.log('Books disappeared from state, recovering data...');
        recoverData();
        toast.info('Restoring your books...');
      }
    }, 10000); // Check every 10 seconds
    
    return () => clearInterval(recoveryInterval);
  }, [books.length, recommendations.length, recoverData, dataRecovered]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="py-6 bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-semibold">Book Tracker</h1>
        </div>
      </header>
      
      <main className="flex-grow py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <BookshelfStats />
          <Bookshelf />
        </div>
      </main>
      
      <footer className="py-6 border-t border-gray-200 text-center text-sm text-gray-600 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <p>Book Tracker</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
