
import React from 'react';
import Bookshelf from '@/components/Bookshelf';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <header className="py-6 border-b border-bookshelf-medium/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-serif text-center">My Reading Chronicles</h1>
        </div>
      </header>
      
      <main className="flex-grow py-8 px-4 sm:px-6 lg:px-8">
        <Bookshelf />
      </main>
      
      <footer className="py-6 border-t border-bookshelf-medium/30 text-center text-sm text-gray-600">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <p>Track your reading journey, one book at a time.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
