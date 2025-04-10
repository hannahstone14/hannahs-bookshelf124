import React from 'react';
import { BookshelfProvider } from '@/context/BookshelfContext';
import BookshelfStats from '@/components/library/BookshelfStats';
import Bookshelf from '@/components/library/Bookshelf';

const Library = () => {
  return (
    <BookshelfProvider>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <main className="flex-grow py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <BookshelfStats />
            <Bookshelf />
          </div>
        </main>
      </div>
    </BookshelfProvider>
  );
};

export default Library; 