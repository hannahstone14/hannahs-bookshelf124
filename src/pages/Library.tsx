import React, { useState } from 'react';
import { BookshelfProvider } from '@/context/BookshelfContext';
import BookshelfStats from '@/components/BookshelfStats';
import Bookshelf from '@/components/Bookshelf';

const Library = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  const handleAddBookClick = () => {
    setIsAddDialogOpen(true);
  };
  
  const handleDialogClose = () => {
    setIsAddDialogOpen(false);
  };
  
  return (
    <BookshelfProvider>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <main className="flex-grow py-6 px-3 sm:py-8 sm:px-4 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <BookshelfStats onAddBookClick={handleAddBookClick} />
            <Bookshelf 
              isAddDialogOpen={isAddDialogOpen} 
              onDialogClose={handleDialogClose} 
              onAddBookClick={handleAddBookClick} 
            />
          </div>
        </main>
      </div>
    </BookshelfProvider>
  );
};

export default Library; 