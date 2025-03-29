
import React, { useEffect } from 'react';
import Bookshelf from '@/components/Bookshelf';
import BookshelfStats from '@/components/BookshelfStats';
import { useBookshelf } from '@/context/BookshelfContext';
import { shouldUseFallback } from '@/lib/supabase';
import * as storageService from '@/services/storageService';

const Index = () => {
  const { books, recommendations, recoverData } = useBookshelf();

  // Initialize and verify data on mount
  useEffect(() => {
    console.log(`Index page loaded. Books: ${books.length}, Recommendations: ${recommendations.length}`);
    console.log(`Using localStorage: ${shouldUseFallback()}`);
    
    // Make sure test books are removed
    storageService.purgeTestBooks();
    
    // Check if books are in localStorage
    try {
      const storedBooks = localStorage.getItem('books');
      const bookCount = storedBooks ? JSON.parse(storedBooks).length : 0;
      console.log(`Books in localStorage: ${bookCount}`);
      
      // If there's a mismatch, recover data from localStorage
      if (books.length === 0 && bookCount > 0) {
        console.log('Data mismatch detected, recovering data...');
        recoverData();
      }
    } catch (error) {
      console.error('Error checking localStorage:', error);
    }
  }, [books.length, recommendations.length, recoverData]);

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
