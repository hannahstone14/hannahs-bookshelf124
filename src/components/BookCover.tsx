
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
      {book.coverUrl ? (
        <div className={cn(
          "relative",
          book.isSeries && "border-2 rounded-md",
          book.isSeries && `border-${layerColors.primary}`
        )}>
          {/* Layer effect for series books */}
          {book.isSeries && (
            <>
              <div 
                className="absolute -right-2 -bottom-2 w-28 h-44 rounded-md -z-10 rotate-2" 
                style={{ backgroundColor: layerColors.secondary }}
              />
              <div 
                className="absolute -right-1 -bottom-1 w-30 h-46 rounded-md -z-20 rotate-1" 
                style={{ backgroundColor: layerColors.tertiary }}
              />
            </>
          )}
          
          <img
            src={book.coverUrl}
            alt={book.title}
            className={cn(
              "w-32 h-48 object-cover rounded-md shadow-lg",
              book.isSeries && "rounded-[5px]"
            )}
          />
          {book.isSeries && (
            <div className="absolute top-1 right-1 bg-purple-700 text-white p-1 rounded-full">
              <BookMarked size={14} />
            </div>
          )}
        </div>
      ) : (
        <div
          className={cn(
            "w-32 h-48 flex items-center justify-center rounded-md shadow-lg relative",
            book.isSeries && "border-2 bg-gradient-to-b from-purple-50 to-transparent",
            book.isSeries && `border-${layerColors.primary}`
          )}
          style={{ backgroundColor: book.isSeries ? '#F3EEFF' : (book.color || '#3B82F6') }}
        >
          {/* Layer effect for series books without cover */}
          {book.isSeries && (
            <>
              <div 
                className="absolute -right-2 -bottom-2 w-28 h-44 rounded-md -z-10 rotate-2" 
                style={{ backgroundColor: layerColors.secondary }}
              />
              <div 
                className="absolute -right-1 -bottom-1 w-30 h-46 rounded-md -z-20 rotate-1" 
                style={{ backgroundColor: layerColors.tertiary }}
              />
            </>
          )}
          
          <span className={cn(
            "text-lg font-bold",
            book.isSeries ? "text-purple-700" : "text-white"
          )}>
            {book.title.substring(0, 1)}
          </span>
          {book.isSeries && (
            <div className="absolute bottom-2 right-2 bg-purple-700 text-white p-1 rounded-full">
              <BookMarked size={16} />
            </div>
          )}
        </div>
      )}
      
      {showStatus && book.status === 'reading' && (
        <div className="absolute bottom-0 left-0 w-full bg-blue-700 text-white text-xs text-center py-1 rounded-b-md">
          {book.progress}%
        </div>
      )}

      {/* Removed the seriesPosition display */}

      {book.isSeries && (
        <div className="absolute -bottom-1 left-0 right-0 mx-auto w-28 bg-purple-100 border border-purple-300 text-purple-800 text-xs text-center py-0.5 rounded-full font-medium">
          Series
        </div>
      )}
    </div>
  );
};

export default BookCover;
