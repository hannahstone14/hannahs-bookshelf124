
import React, { useEffect } from 'react';
import Bookshelf from '@/components/Bookshelf';
import BookshelfStats from '@/components/BookshelfStats';
import { useBookshelf } from '@/context/BookshelfContext';
import { toast } from 'sonner';

const Index = () => {
  const { books, recommendations, recoverData } = useBookshelf();

  // Force data recovery on initial page load and ensure it completes
  useEffect(() => {
    console.log('Index page mounted, checking for data recovery');
    
    // Immediately attempt recovery
    recoverData();
    
    // Set additional recovery attempts with increasing timeouts
    // This helps ensure data loads even if the first attempt fails
    const attempts = [200, 500, 1000, 2000];
    
    const timeoutIds = attempts.map((delay, index) => 
      setTimeout(() => {
        console.log(`Recovery attempt ${index + 1} at ${delay}ms`);
        recoverData();
      }, delay)
    );
    
    return () => timeoutIds.forEach(id => clearTimeout(id));
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
