import React from 'react';
import { Link } from 'react-router-dom';

const Header: React.FC = () => {
  return (
    <header className="py-4 border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center">
          <Link to="/" className="text-2xl font-bold tracking-tight text-gray-900 hover:text-gray-700">
            HANNAH <span className="text-gray-500">STONE</span>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex space-x-8">
          <a 
            href="https://hannahstone.org/#things-ive-done" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Things I've Done
          </a>
          <a 
            href="https://hannahstone.org/#places-ive-worked" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Places I've Worked
          </a>
          <a 
            href="https://hannahstone.org/#i-enjoy" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            I Enjoy
          </a>
        </nav>
      </div>
    </header>
  );
};

export default Header; 