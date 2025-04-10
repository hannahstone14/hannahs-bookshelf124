import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-grow py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Hannah Stone</h1>
          <nav className="space-y-4">
            <Link 
              to="/library" 
              className="block p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            >
              Library
            </Link>
            <a 
              href="/film.html" 
              className="block p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            >
              Film
            </a>
            <a 
              href="/travel.html" 
              className="block p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            >
              Travel
            </a>
          </nav>
        </div>
      </main>
    </div>
  );
};

export default Home; 