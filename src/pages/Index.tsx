
import React, { useEffect } from 'react';
import Bookshelf from '@/components/Bookshelf';
import BookshelfStats from '@/components/BookshelfStats';
import { useBookshelf } from '@/context/BookshelfContext';
import { Button } from '@/components/ui/button';
import { shouldUseFallback } from '@/lib/supabase';

const Index = () => {
  const { books, recommendations, addBook } = useBookshelf();

  // Debug log on mount
  useEffect(() => {
    console.log(`Index page loaded. Books: ${books.length}, Recommendations: ${recommendations.length}`);
    console.log(`Using localStorage: ${shouldUseFallback()}`);
    
    // Check if books are in localStorage
    try {
      const storedBooks = localStorage.getItem('books');
      console.log(`Books in localStorage: ${storedBooks ? JSON.parse(storedBooks).length : 0}`);
    } catch (error) {
      console.error('Error checking localStorage:', error);
    }
  }, [books.length, recommendations.length]);

  const handleAddSampleBook = () => {
    console.log('Adding sample book');
    addBook({
      title: "Sample Book " + Math.floor(Math.random() * 1000),
      author: "Sample Author",
      coverUrl: "",
      status: "read" as const,
      progress: 100,
      pages: 200,
      genres: ["Fiction"],
      favorite: false,
      color: "#" + Math.floor(Math.random()*16777215).toString(16),
      dateRead: new Date()
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="py-6 bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-semibold">My Reading Journey</h1>
          
          {/* Debug buttons - remove in production */}
          <div className="space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleAddSampleBook}
            >
              Add Sample Book
            </Button>
          </div>
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
          <p>Track your reading journey, one book at a time.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
