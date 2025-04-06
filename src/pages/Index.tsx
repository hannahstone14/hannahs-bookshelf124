import React, { useEffect, useState, useCallback } from 'react';
import Bookshelf from '@/components/Bookshelf';
import BookshelfStats from '@/components/BookshelfStats';
import { useBookshelf } from '@/context/BookshelfContext';
import { shouldUseFallback } from '@/lib/supabase';
import { Loader2, BookOpen } from 'lucide-react';

const Index = () => {
  const { books, recommendations, recoverData, isLoading } = useBookshelf();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Debug log on mount
  useEffect(() => {
    console.log(`Index page loaded. Books: ${books.length}, Recommendations: ${recommendations.length}`);
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
    } catch (error) {
      console.error('Error checking localStorage:', error);
    }
  }, [books.length, recommendations.length, recoverData]);

  // Handlers for Add Book Dialog
  const handleAddBookClick = () => {
    setIsAddDialogOpen(true);
  };
  const handleDialogClose = () => {
    setIsAddDialogOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-grow py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <BookshelfStats 
            onAddBookClick={handleAddBookClick} 
          />
          
          <h2 className="text-xl font-medium flex items-center mt-10 mb-4 border-b border-gray-200 pb-2">
            <BookOpen className={`h-5 w-5 mr-2 text-[#219ebc]`} />
            Bookshelf
          </h2>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-lg text-blue-600">Loading your books...</span>
            </div>
          ) : (
            <Bookshelf 
              isAddDialogOpen={isAddDialogOpen} 
              onDialogClose={handleDialogClose} 
              onAddBookClick={handleAddBookClick}
            />
          )}
        </div>
      </main>
      
      <footer className="py-6 border-t border-gray-200 text-center text-sm text-gray-600 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <p>This Is What I Read &copy; {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
