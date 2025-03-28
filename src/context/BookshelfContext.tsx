
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Book } from '@/types/book';
import { v4 as uuidv4 } from 'uuid';
import { toast } from "sonner";

interface BookshelfContextType {
  books: Book[];
  recommendations: Book[];
  addBook: (book: Omit<Book, 'id'>) => void;
  removeBook: (id: string) => void;
  editBook: (id: string, bookData: Partial<Book>) => void;
  reorderBooks: (currentOrder: string[], newOrder: string[]) => void;
  updateProgress: (id: string, progress: number) => void;
}

const BookshelfContext = createContext<BookshelfContextType | undefined>(undefined);

export const useBookshelf = () => {
  const context = useContext(BookshelfContext);
  if (context === undefined) {
    throw new Error('useBookshelf must be used within a BookshelfProvider');
  }
  return context;
};

export const BookshelfProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [books, setBooks] = useState<Book[]>(() => {
    const savedBooks = localStorage.getItem('bookshelf');
    if (savedBooks) {
      try {
        // Parse the dates back to Date objects
        const parsedBooks = JSON.parse(savedBooks);
        return parsedBooks
          .filter((book: any) => book.status !== 'recommendation')
          .map((book: any) => ({
            ...book,
            dateRead: new Date(book.dateRead),
            // Ensure backward compatibility with older data
            status: book.status || 'read',
            genre: book.genre || undefined,
            progress: book.progress || (book.status === 'read' ? 100 : 0),
            pages: book.pages || 0
          }));
      } catch (error) {
        console.error('Failed to parse books from localStorage:', error);
        return [];
      }
    }
    return [];
  });

  const [recommendations, setRecommendations] = useState<Book[]>(() => {
    const savedBooks = localStorage.getItem('bookshelf');
    if (savedBooks) {
      try {
        // Parse the dates back to Date objects
        const parsedBooks = JSON.parse(savedBooks);
        return parsedBooks
          .filter((book: any) => book.status === 'recommendation')
          .map((book: any) => ({
            ...book,
            dateRead: new Date(book.dateRead),
            progress: 0,
            pages: book.pages || 0
          }));
      } catch (error) {
        console.error('Failed to parse recommendations from localStorage:', error);
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    // Combine books and recommendations for storage
    const allBooks = [...books, ...recommendations];
    
    // Convert Date objects to ISO strings for storage
    const booksToStore = allBooks.map(book => ({
      ...book,
      dateRead: book.dateRead.toISOString()
    }));
    localStorage.setItem('bookshelf', JSON.stringify(booksToStore));
  }, [books, recommendations]);

  const addBook = (book: Omit<Book, 'id'>) => {
    const newBook = {
      ...book,
      id: uuidv4(),
      progress: book.progress || (book.status === 'read' ? 100 : 0),
      pages: book.pages || 0
    };
    
    if (book.status === 'recommendation') {
      setRecommendations(currentRecs => [newBook, ...currentRecs]);
      toast.success('Thank you for your recommendation!');
    } else {
      setBooks(currentBooks => [newBook, ...currentBooks]);
      toast.success('Book added to your shelf!');
    }
  };

  const removeBook = (id: string) => {
    // Check if it's in the main bookshelf
    if (books.some(book => book.id === id)) {
      setBooks(currentBooks => currentBooks.filter(book => book.id !== id));
    } 
    // Check if it's in recommendations
    else if (recommendations.some(rec => rec.id === id)) {
      setRecommendations(currentRecs => currentRecs.filter(rec => rec.id !== id));
    }
    
    toast.info('Book removed from your shelf');
  };

  const editBook = (id: string, bookData: Partial<Book>) => {
    // First check if it's in the main bookshelf
    if (books.some(book => book.id === id)) {
      setBooks(currentBooks => 
        currentBooks.map(book => 
          book.id === id ? { ...book, ...bookData } : book
        )
      );
    } 
    // Then check if it's in recommendations
    else if (recommendations.some(rec => rec.id === id)) {
      setRecommendations(currentRecs => 
        currentRecs.map(rec => 
          rec.id === id ? { ...rec, ...bookData } : rec
        )
      );
    }
    
    toast.success('Book updated successfully!');
  };

  const updateProgress = (id: string, progress: number) => {
    setBooks(currentBooks =>
      currentBooks.map(book =>
        book.id === id 
          ? { 
              ...book, 
              progress,
              // Update status based on progress
              status: progress === 100 ? 'read' : 'reading'
            } 
          : book
      )
    );
    toast.success('Reading progress updated!');
  };

  const reorderBooks = (currentOrder: string[], newOrder: string[]) => {
    setBooks(currentBooks => {
      // Create a new copy of the books array
      const updatedBooks = [...currentBooks];
      
      // Find books that need to be reordered
      const booksToReorder = updatedBooks.filter(book => currentOrder.includes(book.id));
      
      // Create a map for quick lookup
      const bookMap = new Map(booksToReorder.map(book => [book.id, book]));
      
      // For each book in the new order, find its corresponding book and update
      newOrder.forEach((id, index) => {
        const book = bookMap.get(id);
        if (book) {
          book.order = index;
        }
      });
      
      // Return the updated books
      return updatedBooks;
    });
    
    toast.success('Books reordered successfully!');
  };

  const value = {
    books,
    recommendations,
    addBook,
    removeBook,
    editBook,
    reorderBooks,
    updateProgress
  };

  return (
    <BookshelfContext.Provider value={value}>
      {children}
    </BookshelfContext.Provider>
  );
};
