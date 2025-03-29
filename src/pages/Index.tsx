
import React, { useEffect } from 'react';
import Bookshelf from '@/components/Bookshelf';
import BookshelfStats from '@/components/BookshelfStats';
import { useBookshelf } from '@/context/BookshelfContext';
import { shouldUseFallback } from '@/lib/supabase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Book, BookOpenText, Library } from 'lucide-react';

const Index = () => {
  const { books, recommendations } = useBookshelf();

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

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="py-6 bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-semibold">Book Tracker</h1>
          <div className="flex items-center space-x-4">
            <div className="text-right mr-2">
              <p className="font-medium">Jane Doe</p>
              <p className="text-sm text-gray-500">Book enthusiast</p>
            </div>
            <Avatar className="h-10 w-10 border border-gray-200">
              <AvatarImage src="/placeholder.svg" alt="Avatar" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
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
          <p>Book Tracker</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
