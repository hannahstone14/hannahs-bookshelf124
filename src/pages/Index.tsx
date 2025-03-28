
import React, { useEffect } from 'react';
import Bookshelf from '@/components/Bookshelf';
import BookshelfStats from '@/components/BookshelfStats';
import { useBookshelf } from '@/context/BookshelfContext';
import { toast } from 'sonner';

const Index = () => {
  const { books, recommendations, recoverData } = useBookshelf();

  // Force data recovery on initial page load
  useEffect(() => {
    // Ensure we attempt to recover data on initial page load
    console.log('Index page mounted, checking for data recovery');
    const timeoutId = setTimeout(() => {
      recoverData();
    }, 200);
    
    return () => clearTimeout(timeoutId);
  }, [recoverData]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="py-6 bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold">My Reading Journey</h1>
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
