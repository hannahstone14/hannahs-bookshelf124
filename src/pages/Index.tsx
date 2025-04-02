
import React, { useEffect } from 'react';
import { useBookshelf } from '@/context/BookshelfContext';

const Index = () => {
  const { books, recommendations } = useBookshelf();

  // Debug log on mount
  useEffect(() => {
    console.log('Index page rendered');
    console.log(`Books: ${books.length}, Recommendations: ${recommendations.length}`);
  }, [books.length, recommendations.length]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 p-8">
      <h1 className="text-3xl font-bold text-center mb-8">This is what I read!</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="text-xl">You have {books.length} books in your collection.</p>
        
        {books.length > 0 && (
          <div className="mt-4">
            <h2 className="text-2xl font-semibold mb-2">Your Books:</h2>
            <ul className="list-disc pl-5">
              {books.slice(0, 5).map((book, index) => (
                <li key={index} className="mb-1">
                  {book.title} by {book.author}
                </li>
              ))}
              {books.length > 5 && <li>...and {books.length - 5} more</li>}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
