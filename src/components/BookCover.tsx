import React, { useState, useEffect } from 'react';
import { Book } from '@/types/book';
import { cn } from '@/lib/utils';
import { BookMarked, Star } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface BookCoverProps {
  book: Book;
  showStatus?: boolean;
  showProgress?: boolean;
  showControls?: boolean;
  className?: string;
}

const BookCover: React.FC<BookCoverProps> = ({ book, showStatus, showProgress, showControls, className }) => {
  // Get an appropriate color for the book cover
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
    <div className={cn("relative aspect-[2/3] w-full overflow-hidden rounded-md shadow-md bg-gray-100 group", className)}>
      {/* Wrapper for Image/Fallback and Progress Bar */}
      <div className="relative w-full h-full">
        {book.coverUrl ? (
          <img
            src={book.coverUrl}
            alt={book.title}
            className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div 
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: book.color || '#3B82F6' }} // Use a default color
          >
            <span className="text-white text-sm font-medium px-2 text-center line-clamp-2">{book.title}</span>
          </div>
        )}

        {/* Progress Bar (Now positioned relative to this inner wrapper) */}
        {showProgress && book.status === 'reading' && book.progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-200/80 backdrop-blur-sm">
            <div 
              className="h-full bg-[#219ebc]/90" 
              style={{ width: `${book.progress}%` }}
            ></div>
          </div>
        )}
      </div> { /* End of inner wrapper */ }

      {/* Edit/Delete Buttons (Remain relative to outer container) */}
      {showControls && (
        <div className="absolute top-1 right-1 bg-yellow-400 text-white p-1 rounded-full z-20 shadow-sm">
          <Star size={14} fill="white" />
        </div>
      )}

      {/* Favorite star badge */}
      {book.favorite && (
        <div className="absolute top-1 right-1 bg-yellow-400 text-white p-1 rounded-full z-20 shadow-sm">
          <Star size={14} fill="white" />
        </div>
      )}

      {/* Reading status badge - Only display on BookCover, not in the grid */}
      {showStatus && book.status === 'reading' && (
        <div className="absolute top-1 left-1 z-20">
          <Badge variant="secondary" className="bg-blue-600 text-white text-xs px-2 py-0.5">
            Reading
          </Badge>
        </div>
      )}
      
      {/* Tags badges */}
      {book.tags && book.tags.length > 0 && (
        <div className="absolute bottom-2 left-0 right-0 flex flex-wrap justify-center gap-1 px-1 z-20">
          {book.tags.map((tag, index) => (
            <Badge 
              key={index} 
              variant="outline" 
              className="bg-black/70 border-none text-white text-[10px] px-1.5 py-0 truncate max-w-[80px]"
            >
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Series progress tracker */}
      {book.isSeries && seriesProgress && (
        <div className="mt-1 w-full">
          {!seriesProgress.isCompleted && (
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
