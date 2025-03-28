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
  toggleFavorite: (id: string) => void;
  recoverData: () => void;
  hasBackup: boolean;
}

const BookshelfContext = createContext<BookshelfContextType | undefined>(undefined);

export const useBookshelf = () => {
  const context = useContext(BookshelfContext);
  if (context === undefined) {
    throw new Error('useBookshelf must be used within a BookshelfProvider');
  }
  return context;
};

// Helper function to safely parse dates
const parseDateFields = (data: any) => {
  try {
    // Ensure dateRead is a proper Date object
    return {
      ...data,
      dateRead: data.dateRead ? new Date(data.dateRead) : new Date(),
    };
  } catch (error) {
    console.error('Failed to parse date fields', error);
    return {
      ...data,
      dateRead: new Date()
    };
  }
};

// Create backup of data in a separate localStorage key
const backupData = (books: Book[], recommendations: Book[]) => {
  try {
    const booksToStore = books.map(book => ({
      ...book,
      dateRead: book.dateRead instanceof Date ? book.dateRead.toISOString() : book.dateRead
    }));
    
    const recsToStore = recommendations.map(rec => ({
      ...rec,
      dateRead: rec.dateRead instanceof Date ? rec.dateRead.toISOString() : rec.dateRead
    }));
    
    localStorage.setItem('books_backup', JSON.stringify(booksToStore));
    localStorage.setItem('recommendations_backup', JSON.stringify(recsToStore));
    localStorage.setItem('backup_timestamp', new Date().toISOString());
    
    console.log('Data backup created:', booksToStore.length, 'books,', recsToStore.length, 'recommendations');
  } catch (error) {
    console.error('Failed to create backup:', error);
  }
};

// Helper function to load books from localStorage with enhanced error handling
const loadBooksFromStorage = () => {
  try {
    const savedBooks = localStorage.getItem('books');
    if (savedBooks) {
      // Check if the data is valid JSON
      const parsedBooks = JSON.parse(savedBooks);
      if (!Array.isArray(parsedBooks)) {
        console.error('Books data is not an array, trying to recover from backup');
        return [];
      }
      
      return parsedBooks
        .filter((book: any) => book && typeof book === 'object' && book.status !== 'recommendation')
        .map((book: any) => ({
          ...parseDateFields(book),
          // Ensure backward compatibility with older data
          status: book.status || 'read',
          genres: book.genres || (book.genre ? [book.genre] : []),
          progress: book.progress || (book.status === 'read' ? 100 : 0),
          pages: book.pages || 0,
          favorite: book.favorite || false,
          color: book.color || null
        }));
    }
  } catch (error) {
    console.error('Failed to parse books from localStorage:', error);
  }
  return [];
};

// Helper function to load recommendations from localStorage with enhanced error handling
const loadRecommendationsFromStorage = () => {
  try {
    const savedRecs = localStorage.getItem('recommendations');
    if (savedRecs) {
      // Check if the data is valid JSON
      const parsedRecs = JSON.parse(savedRecs);
      if (!Array.isArray(parsedRecs)) {
        console.error('Recommendations data is not an array, trying to recover from backup');
        return [];
      }
      
      return parsedRecs
        .filter((book: any) => book && typeof book === 'object')
        .map((book: any) => ({
          ...parseDateFields(book),
          progress: 0,
          pages: book.pages || 0,
          genres: book.genres || (book.genre ? [book.genre] : []),
          favorite: false,
          color: book.color || null,
          status: 'recommendation'
        }));
    }
  } catch (error) {
    console.error('Failed to parse recommendations from localStorage:', error);
  }
  return [];
};

// Helper function to check if backup data exists
const hasBackupData = () => {
  const backupTimestamp = localStorage.getItem('backup_timestamp');
  const booksBackup = localStorage.getItem('books_backup');
  return !!(backupTimestamp && booksBackup);
};

// Helper function to load backup data
const loadBackupData = () => {
  const backupBooks = localStorage.getItem('books_backup');
  const backupRecs = localStorage.getItem('recommendations_backup');
  
  let books: Book[] = [];
  let recommendations: Book[] = [];
  
  if (backupBooks) {
    try {
      const parsedBooks = JSON.parse(backupBooks);
      books = parsedBooks
        .filter((book: any) => book && typeof book === 'object' && book.status !== 'recommendation')
        .map((book: any) => ({
          ...parseDateFields(book),
          status: book.status || 'read',
          genres: book.genres || (book.genre ? [book.genre] : []),
          progress: book.progress || (book.status === 'read' ? 100 : 0),
          pages: book.pages || 0,
          favorite: book.favorite || false,
          color: book.color || null
        }));
    } catch (error) {
      console.error('Failed to parse books backup:', error);
    }
  }
  
  if (backupRecs) {
    try {
      const parsedRecs = JSON.parse(backupRecs);
      recommendations = parsedRecs
        .filter((book: any) => book && typeof book === 'object')
        .map((book: any) => ({
          ...parseDateFields(book),
          progress: 0,
          pages: book.pages || 0,
          genres: book.genres || (book.genre ? [book.genre] : []),
          favorite: false,
          color: book.color || null,
          status: 'recommendation'
        }));
    } catch (error) {
      console.error('Failed to parse recommendations backup:', error);
    }
  }
  
  return { books, recommendations };
};

export const BookshelfProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [books, setBooks] = useState<Book[]>(() => loadBooksFromStorage());
  const [recommendations, setRecommendations] = useState<Book[]>(() => loadRecommendationsFromStorage());
  const [hasBackup, setHasBackup] = useState<boolean>(hasBackupData());

  // Create a backup when data is loaded initially
  useEffect(() => {
    const hasInitialData = books.length > 0 || recommendations.length > 0;
    if (hasInitialData) {
      backupData(books, recommendations);
    }
  }, []);

  // Save books to localStorage whenever they change with debounce
  useEffect(() => {
    try {
      const booksToStore = books.map(book => ({
        ...book,
        // Convert Date objects to ISO strings before storing
        dateRead: book.dateRead instanceof Date ? book.dateRead.toISOString() : book.dateRead
      }));
      
      localStorage.setItem('books', JSON.stringify(booksToStore));
      console.log('Saved books to localStorage:', booksToStore.length);
      
      // Create backup data 
      backupData(books, recommendations);
      setHasBackup(true);
    } catch (error) {
      console.error('Failed to save books to localStorage:', error);
    }
  }, [books]);

  // Save recommendations to localStorage whenever they change
  useEffect(() => {
    try {
      const recsToStore = recommendations.map(rec => ({
        ...rec,
        // Convert Date objects to ISO strings before storing
        dateRead: rec.dateRead instanceof Date ? rec.dateRead.toISOString() : rec.dateRead
      }));
      
      localStorage.setItem('recommendations', JSON.stringify(recsToStore));
      console.log('Saved recommendations to localStorage:', recsToStore.length);
      
      // Update backup data
      backupData(books, recommendations);
      setHasBackup(true);
    } catch (error) {
      console.error('Failed to save recommendations to localStorage:', error);
    }
  }, [recommendations]);

  // Listen for storage events from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'books' && event.newValue) {
        try {
          const parsedBooks = JSON.parse(event.newValue);
          if (Array.isArray(parsedBooks)) {
            setBooks(parsedBooks
              .filter((book: any) => book && typeof book === 'object' && book.status !== 'recommendation')
              .map((book: any) => ({
                ...parseDateFields(book),
                status: book.status || 'read',
                genres: book.genres || (book.genre ? [book.genre] : []),
                progress: book.progress || (book.status === 'read' ? 100 : 0),
                pages: book.pages || 0,
                favorite: book.favorite || false,
                color: book.color || null
              }))
            );
            console.log('Updated books from another tab:', parsedBooks.length);
          } else {
            console.error('Received invalid books data from another tab');
          }
        } catch (error) {
          console.error('Failed to parse books from storage event:', error);
        }
      }
      
      if (event.key === 'recommendations' && event.newValue) {
        try {
          const parsedRecs = JSON.parse(event.newValue);
          if (Array.isArray(parsedRecs)) {
            setRecommendations(parsedRecs
              .filter((rec: any) => rec && typeof rec === 'object')
              .map((rec: any) => ({
                ...parseDateFields(rec),
                progress: 0,
                pages: rec.pages || 0,
                genres: rec.genres || (rec.genre ? [rec.genre] : []),
                favorite: false,
                color: rec.color || null,
                status: 'recommendation'
              }))
            );
            console.log('Updated recommendations from another tab:', parsedRecs.length);
          } else {
            console.error('Received invalid recommendations data from another tab');
          }
        } catch (error) {
          console.error('Failed to parse recommendations from storage event:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const recoverData = () => {
    try {
      const { books: backupBooks, recommendations: backupRecs } = loadBackupData();
      
      if (backupBooks.length > 0 || backupRecs.length > 0) {
        setBooks(prev => {
          // Keep the books that are already in the state, as long as they have unique IDs
          const existingIds = new Set(prev.map(book => book.id));
          const uniqueBackupBooks = backupBooks.filter(book => !existingIds.has(book.id));
          
          const combinedBooks = [...prev, ...uniqueBackupBooks];
          return combinedBooks;
        });
        
        setRecommendations(prev => {
          // Keep the recommendations that are already in the state, as long as they have unique IDs
          const existingIds = new Set(prev.map(rec => rec.id));
          const uniqueBackupRecs = backupRecs.filter(rec => !existingIds.has(rec.id));
          
          const combinedRecs = [...prev, ...uniqueBackupRecs];
          return combinedRecs;
        });
        
        toast.success(`Recovered ${backupBooks.length} books and ${backupRecs.length} recommendations`);
      } else {
        toast.error('No backup data available to recover');
      }
    } catch (error) {
      console.error('Failed to recover data from backup:', error);
      toast.error('Failed to recover data from backup');
    }
  };

  const addBook = (book: Omit<Book, 'id'>) => {
    // Generate a persistent color if not provided
    const bookColor = book.color || 
      ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'][
        Math.floor(Math.random() * 6)
      ];
    
    const newBook = {
      ...book,
      id: uuidv4(),
      progress: book.progress || (book.status === 'read' ? 100 : 0),
      pages: book.pages || 0,
      favorite: book.favorite || false,
      genres: book.genres || [],
      color: bookColor, // Store the color persistently
      dateRead: book.dateRead || new Date()
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
      toast.info('Book removed from your shelf');
    } 
    // Check if it's in recommendations
    else if (recommendations.some(rec => rec.id === id)) {
      setRecommendations(currentRecs => currentRecs.filter(rec => rec.id !== id));
      toast.info('Recommendation removed');
    }
  };

  const editBook = (id: string, bookData: Partial<Book>) => {
    // First check if it's in the main bookshelf
    if (books.some(book => book.id === id)) {
      setBooks(currentBooks => 
        currentBooks.map(book => 
          book.id === id ? { ...book, ...bookData } : book
        )
      );
      toast.success('Book updated successfully!');
    } 
    // Then check if it's in recommendations
    else if (recommendations.some(rec => rec.id === id)) {
      setRecommendations(currentRecs => 
        currentRecs.map(rec => 
          rec.id === id ? { ...rec, ...bookData } : rec
        )
      );
      toast.success('Recommendation updated!');
    }
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

  const toggleFavorite = (id: string) => {
    // Check if it's in the main bookshelf
    if (books.some(book => book.id === id)) {
      setBooks(currentBooks => 
        currentBooks.map(book => 
          book.id === id ? { ...book, favorite: !book.favorite } : book
        )
      );
      toast.success('Favorite status updated!');
    } 
    // Then check if it's in recommendations
    else if (recommendations.some(rec => rec.id === id)) {
      setRecommendations(currentRecs => 
        currentRecs.map(rec => 
          rec.id === id ? { ...rec, favorite: !rec.favorite } : rec
        )
      );
      toast.success('Favorite status updated!');
    }
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
    updateProgress,
    toggleFavorite,
    recoverData,
    hasBackup
  };

  return (
    <BookshelfContext.Provider value={value}>
      {children}
    </BookshelfContext.Provider>
  );
};
