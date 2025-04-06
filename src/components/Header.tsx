import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="py-6 bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <div className="flex items-center">
          <Link to="/" className="text-2xl font-bold text-gray-900 hover:text-gray-700 transition-colors">
            HANNAH STONE
          </Link>
        </div>
        
        <nav className="hidden md:flex space-x-8">
          <a 
            href="/" 
            className="text-gray-700 hover:text-gray-900 transition-colors"
          >
            This Is What I Read
          </a>
          <a 
            href="https://hannahstone.org/things" 
            className="text-gray-700 hover:text-gray-900 transition-colors"
            target="_blank" 
            rel="noopener noreferrer"
          >
            Things I've Done
          </a>
          <a 
            href="https://hannahstone.org/places" 
            className="text-gray-700 hover:text-gray-900 transition-colors"
            target="_blank" 
            rel="noopener noreferrer"
          >
            Places I've Worked
          </a>
          <a 
            href="https://hannahstone.org/enjoy" 
            className="text-gray-700 hover:text-gray-900 transition-colors"
            target="_blank" 
            rel="noopener noreferrer"
          >
            I Enjoy
          </a>
        </nav>
      </div>
    </header>
  );
};

export default Header; 