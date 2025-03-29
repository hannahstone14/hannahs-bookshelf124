
import React, { useState, useEffect } from 'react';
import { Book } from '@/types/book';
import { cn } from '@/lib/utils';
import { BookMarked, Star } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface BookCoverProps {
  book: Book;
  showStatus?: boolean;
}

const BookCover: React.FC<BookCoverProps> = ({ book, showStatus }) => {
  // Get an appropriate color for the layered effect based on cover or book color
  const [layerColors, setLayerColors] = useState({
    primary: '#9b87f5',  // Default purple primary color
    secondary: '#e2e2e2', // Light gray for secondary layer
    tertiary: '#cccccc'   // Medium gray for tertiary layer
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
        secondary: convertToGrayTone(baseColor, 0.9),  // Light gray variant
        tertiary: convertToGrayTone(baseColor, 0.8)    // Medium gray variant
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

  // Convert color to a more gray tone for subtle layering
  const convertToGrayTone = (hex: string, opacity: number) => {
    // Convert hex to RGB
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    
    // Calculate gray value (weighted average for perceived brightness)
    const grayValue = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    
    // Create a gray color with slight tint from original
    const grayR = Math.round(grayValue * 0.7 + r * 0.3);
    const grayG = Math.round(grayValue * 0.7 + g * 0.3);
    const grayB = Math.round(grayValue * 0.7 + b * 0.3);
    
    // Convert back to hex with opacity
    return `rgba(${grayR}, ${grayG}, ${grayB}, ${opacity})`;
  };

  // Calculate series progress
  const getSeriesProgress = () => {
    // If there's no series position or it's not a series, return null
    if (!book.isSeries || !book.seriesPosition) return null;

    // Get total books in series based on the highest series position
    const totalInSeries = book.seriesName ? 
      (book.seriesPosition > 0 ? Math.max(book.seriesPosition, book.seriesPosition) : book.seriesPosition) : book.seriesPosition;
    
    // If the book is read, count it as completed for that position
    const booksRead = book.status === 'read' ? book.seriesPosition : book.seriesPosition - 1;
    const isCompleted = booksRead >= totalInSeries;

    return {
      booksRead: Math.max(0, booksRead),
      totalInSeries,
      isCompleted
    };
  };

  const seriesProgress = book.isSeries ? getSeriesProgress() : null;

  return (
    <div className={cn(
      "relative", 
      "transform transition-transform hover:scale-105"
    )}>
      {/* Layer effect for series books - positioned straight and to the right/bottom */}
      {book.isSeries && (
        <>
          <div 
            className="absolute w-full h-full rounded-md z-0" 
            style={{ 
              backgroundColor: '#eaeaea', 
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
              top: '5px',
              left: '5px'
            }}
          />
          <div 
            className="absolute w-full h-full rounded-md z-0" 
            style={{ 
              backgroundColor: '#dedede',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
              top: '10px',
              left: '10px'
            }}
          />
        </>
      )}
      
      <div className="relative z-10">
        {book.coverUrl ? (
          <img
            src={book.coverUrl}
            alt={displayTitle}
            className={cn(
              "w-32 h-48 object-cover rounded-md shadow-lg",
              book.isSeries && "border-2",
            )}
            style={book.isSeries ? { borderColor: layerColors.primary } : {}}
          />
        ) : (
          <div
            className={cn(
              "w-32 h-48 flex items-center justify-center rounded-md shadow-lg",
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
          </div>
        )}
        
        {/* Series indicator */}
        {book.isSeries && (
          <div className="absolute top-1 right-1 bg-purple-700 text-white p-1 rounded-full z-20">
            <BookMarked size={14} />
          </div>
        )}
        
        {/* Favorite star badge */}
        {book.favorite && (
          <div className="absolute top-1 left-1 bg-yellow-400 text-white p-1 rounded-full z-20 shadow-sm">
            <Star size={14} fill="white" />
          </div>
        )}
      </div>
      
      {/* Reading progress */}
      {showStatus && book.status === 'reading' && (
        <div className="absolute bottom-0 left-0 w-full bg-blue-700 text-white text-xs text-center py-1 rounded-b-md z-20">
          {book.progress}%
        </div>
      )}
      
      {/* Series progress tracker */}
      {book.isSeries && seriesProgress && (
        <div className="mt-1 w-full">
          {seriesProgress.isCompleted ? (
            <div className="bg-green-100 text-green-800 text-xs text-center py-1 px-2 rounded-full w-full">
              Completed
            </div>
          ) : (
            <div className="w-full">
              <div className="text-xs text-center text-gray-700 mb-0.5">
                {seriesProgress.booksRead} of {seriesProgress.totalInSeries} read
              </div>
              <Progress 
                value={(seriesProgress.booksRead / seriesProgress.totalInSeries) * 100} 
                className="h-1.5 bg-gray-200" 
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BookCover;
