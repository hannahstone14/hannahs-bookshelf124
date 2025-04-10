import React from 'react';
import { Link } from 'react-router-dom';

const Header: React.FC = () => {
  return (
    <header className="py-4 border-b border-gray-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center">
        {/* Logo */}
        <div className="flex items-center self-start sm:self-center mb-2 sm:mb-0">
          <a href="https://www.hannahstone.org/" target="_blank" rel="noopener noreferrer">
            <img src="/images/hannahstone-logo.png" alt="Hannah Stone Logo" className="h-8" />
          </a>
        </div>

        {/* Navigation Links - Stack on mobile */}
        <nav className="flex flex-col sm:flex-row items-center sm:space-x-8 space-y-2 sm:space-y-0 w-full sm:w-auto">
          <a 
            href="https://hannahstone.org/#things-ive-done" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-sm font-medium text-gray-600 hover:text-gray-900 w-full sm:w-auto text-center sm:text-left"
          >
            Things I've Done
          </a>
          <a 
            href="https://hannahstone.org/#places-ive-worked" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-sm font-medium text-gray-600 hover:text-gray-900 w-full sm:w-auto text-center sm:text-left"
          >
            Places I've Worked
          </a>
          <a 
            href="https://hannahstone.org/#i-enjoy" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-sm font-medium text-gray-600 hover:text-gray-900 w-full sm:w-auto text-center sm:text-left"
          >
            I Enjoy
          </a>
        </nav>
      </div>
    </header>
  );
};

export default Header; 