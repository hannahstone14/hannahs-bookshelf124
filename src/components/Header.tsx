import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="py-6 bg-pink-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <div className="flex items-center">
          <BookOpen className="h-6 w-6 text-pink-800 mr-2" />
          <h1 className="text-2xl font-semibold text-pink-800">
            <Link to="/" className="hover:text-pink-600 transition-colors">
              This Is What I Read
            </Link>
          </h1>
        </div>
      </div>
    </header>
  );
};

export default Header; 