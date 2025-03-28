
import React, { useEffect } from 'react';
import Bookshelf from '@/components/Bookshelf';
import BookshelfStats from '@/components/BookshelfStats';
import { useBookshelf } from '@/context/BookshelfContext';

const Index = () => {
  const { books, recommendations } = useBookshelf();

  // Log books and localStorage data to verify data is being loaded correctly
  useEffect(() => {
    console.log('Index page loaded with', books.length, 'books and', recommendations.length, 'recommendations');
    
    // Check localStorage to verify saved data
    try {
      const storedBooks = localStorage.getItem('books');
      const storedRecs = localStorage.getItem('recommendations');
      const booksBackup = localStorage.getItem('books_backup');
      
      console.log('localStorage books:', storedBooks ? JSON.parse(storedBooks).length : 0);
      console.log('localStorage recommendations:', storedRecs ? JSON.parse(storedRecs).length : 0);
      console.log('localStorage backup available:', !!booksBackup);
      
      if (booksBackup) {
        const backupData = JSON.parse(booksBackup);
        console.log('Backup contains', backupData.length, 'books');
      }
    } catch (error) {
      console.error('Error checking localStorage:', error);
    }
  }, [books, recommendations]);

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
