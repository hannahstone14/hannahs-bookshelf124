
import React, { useState, useEffect } from 'react';
import { Book } from '@/types/book';
import { cn } from '@/lib/utils';
import { BookMarked } from 'lucide-react';

interface BookCoverProps {
  book: Book;
  showStatus?: boolean;
}

const BookCover: React.FC<BookCoverProps> = ({ book, showStatus }) => {
  // Get an appropriate color for the layered effect based on cover or book color
  const [layerColors, setLayerColors] = useState({
    primary: '#9b87f5',  // Default purple primary color
    secondary: '#7E69AB', // Default purple secondary color
    tertiary: '#6E59A5'   // Default purple tertiary color
  });

  // Create a modified title that adds "Series" for series books
  const displayTitle = book.isSeries ? `${book.title} Series` : book.title;

  useEffect(() => {
    // If book has specific color, use variants of that color for layers
    if (book.color) {
      // Create slightly lighter/darker variants for layering
      const baseColor = book.color;
      setLayerColors({
        primary: baseColor,
        secondary: adjustColorBrightness(baseColor, -15),  // Slightly darker
        tertiary: adjustColorBrightness(baseColor, -30)    // Even darker
      });
    }
  }, [book.color]);

  // Helper function to adjust color brightness
  const adjustColorBrightness = (hex: string, percent: number) => {
    // Convert hex to RGB
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    
    // Adjust brightness
    r = Math.min(255, Math.max(0, r + percent));
    g = Math.min(255, Math.max(0, g + percent));
    b = Math.min(255, Math.max(0, b + percent));
    
    // Convert back to hex
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  return (
    <div className={cn(
      "relative", 
      book.isSeries && "transform transition-transform hover:scale-105"
    )}>
      {/* Layer effect for series books - visible behind the cover */}
      {book.isSeries && (
        <>
          <div 
            className="absolute -right-3 -bottom-3 w-32 h-48 rounded-md z-0 rotate-3 shadow-md opacity-75" 
            style={{ backgroundColor: layerColors.tertiary }}
          />
          <div 
            className="absolute -right-1.5 -bottom-1.5 w-32 h-48 rounded-md z-0 rotate-1.5 shadow-md opacity-85" 
            style={{ backgroundColor: layerColors.secondary }}
          />
        </>
      )}
      
      {book.coverUrl ? (
        <div className="relative">
          <img
            src={book.coverUrl}
            alt={displayTitle}
            className={cn(
              "w-32 h-48 object-cover rounded-md shadow-lg z-10 relative",
              book.isSeries && "border-2",
            )}
            style={book.isSeries ? { borderColor: layerColors.primary } : {}}
          />
          {book.isSeries && (
            <div className="absolute top-1 right-1 bg-purple-700 text-white p-1 rounded-full z-20">
              <BookMarked size={14} />
            </div>
          )}
        </div>
      ) : (
        <div
          className={cn(
            "w-32 h-48 flex items-center justify-center rounded-md shadow-lg relative z-10",
            book.isSeries && "bg-gradient-to-b from-purple-50 to-transparent"
          )}
          style={{ backgroundColor: book.isSeries ? '#F3EEFF' : (book.color || '#3B82F6') }}
        >
          <span className={cn(
            "text-lg font-bold",
            book.isSeries ? "text-purple-700" : "text-white"
          )}>
            {displayTitle.substring(0, 1)}
          </span>
          {book.isSeries && (
            <div className="absolute top-1 right-1 bg-purple-700 text-white p-1 rounded-full z-20">
              <BookMarked size={16} />
            </div>
          )}
        </div>
      )}
      
      {showStatus && book.status === 'reading' && (
        <div className="absolute bottom-0 left-0 w-full bg-blue-700 text-white text-xs text-center py-1 rounded-b-md z-20">
          {book.progress}%
        </div>
      )}
    </div>
  );
};

export default BookCover;
