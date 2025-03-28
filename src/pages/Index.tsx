
import React, { useEffect } from 'react';
import Bookshelf from '@/components/Bookshelf';
import BookshelfStats from '@/components/BookshelfStats';
import { useBookshelf } from '@/context/BookshelfContext';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';

const Index = () => {
  const { books, recommendations, recoverData, hasBackup } = useBookshelf();

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

  const handleRecoverData = () => {
    console.log('Recover button clicked, attempting data recovery...');
    recoverData();
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="py-6 bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-semibold">My Reading Journey</h1>
          
          {hasBackup && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRecoverData}
              className="border-amber-600 text-amber-700 hover:bg-amber-50"
              title="Restore books from backup if some were lost during refresh"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Recover Books
            </Button>
          )}
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
