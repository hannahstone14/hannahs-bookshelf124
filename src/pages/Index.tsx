
import React from 'react';
import Bookshelf from '@/components/Bookshelf';
import BookshelfStats from '@/components/BookshelfStats';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="py-6 border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-sans text-center font-medium">Book Tracker</h1>
        </div>
      </header>
      
      <main className="flex-grow py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <BookshelfStats />
          <Bookshelf />
        </div>
      </main>
      
      <footer className="py-6 border-t border-gray-200 text-center text-sm text-gray-600">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <p>Track your reading journey, one book at a time.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
