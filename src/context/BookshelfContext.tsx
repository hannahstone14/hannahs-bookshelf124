import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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

// Storage keys
const BOOKS_STORAGE_KEY = 'bookshelf_books_v2';
const RECOMMENDATIONS_STORAGE_KEY = 'bookshelf_recommendations_v2';
const BACKUP_STORAGE_KEY = 'bookshelf_backup_v2';
const LAST_SAVED_KEY = 'bookshelf_last_saved_v2';

// Helper function to safely parse dates
const parseDateFields = (book: any): Book => {
  try {
    return {
      ...book,
      dateRead: book.dateRead ? new Date(book.dateRead) : new Date(),
    };
  } catch (error) {
    console.error('Failed to parse date fields', error);
    return {
      ...book,
      dateRead: new Date()
    };
  }
};

// Helper function to prepare books for storage
const prepareForStorage = (book: Book) => {
  return {
    ...book,
    dateRead: book.dateRead instanceof Date ? book.dateRead.toISOString() : book.dateRead
  };
};

// Save books to multiple localStorage keys with timestamps
const saveToStorage = (books: Book[], recommendations: Book[]) => {
  try {
    console.log(`Saving ${books.length} books and ${recommendations.length} recommendations to storage`);
    
    const timestamp = new Date().toISOString();
    const booksToStore = books.map(prepareForStorage);
    const recsToStore = recommendations.map(prepareForStorage);
    
    // Primary storage
    localStorage.setItem(BOOKS_STORAGE_KEY, JSON.stringify(booksToStore));
    localStorage.setItem(RECOMMENDATIONS_STORAGE_KEY, JSON.stringify(recsToStore));
    localStorage.setItem(LAST_SAVED_KEY, timestamp);
    
    // Backup storage - full data with timestamp
    const backupData = {
      timestamp,
      books: booksToStore,
      recommendations: recsToStore
    };
    localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(backupData));
    
    // Additional backups with versioning
    const versionedKey = `bookshelf_backup_${Date.now()}`;
    localStorage.setItem(versionedKey, JSON.stringify(backupData));
    
    // Store in sessionStorage as well for additional redundancy
    sessionStorage.setItem(BOOKS_STORAGE_KEY, JSON.stringify(booksToStore));
    sessionStorage.setItem(RECOMMENDATIONS_STORAGE_KEY, JSON.stringify(recsToStore));
    
    console.log('Storage save complete with timestamp:', timestamp);
    return true;
  } catch (error) {
    console.error('Failed to save to storage:', error);
    return false;
  }
};

// Load books from storage with fallbacks
const loadFromStorage = () => {
  console.log('Loading data from storage with fallbacks');
  
  try {
    // Try primary storage first
    const booksData = localStorage.getItem(BOOKS_STORAGE_KEY);
    const recsData = localStorage.getItem(RECOMMENDATIONS_STORAGE_KEY);
    
    if (booksData) {
      const parsedBooks = JSON.parse(booksData);
      if (Array.isArray(parsedBooks) && parsedBooks.length > 0) {
        console.log(`Loaded ${parsedBooks.length} books from primary storage`);
        const books = parsedBooks.map(parseDateFields);
        
        const parsedRecs = recsData ? JSON.parse(recsData) : [];
        const recommendations = parsedRecs.map(parseDateFields);
        
        console.log(`Loaded ${recommendations.length} recommendations from primary storage`);
        return { books, recommendations };
      }
    }
    
    // Try backup storage if primary fails
    const backupData = localStorage.getItem(BACKUP_STORAGE_KEY);
    if (backupData) {
      const parsed = JSON.parse(backupData);
      if (parsed && parsed.books && Array.isArray(parsed.books)) {
        console.log(`Loaded ${parsed.books.length} books from backup storage`);
        const books = parsed.books.map(parseDateFields);
        const recommendations = (parsed.recommendations || []).map(parseDateFields);
        
        // Immediately save back to primary storage for next time
        saveToStorage(books, recommendations);
        
        return { books, recommendations };
      }
    }
    
    // Try sessionStorage as last resort
    const sessionBooksData = sessionStorage.getItem(BOOKS_STORAGE_KEY);
    if (sessionBooksData) {
      const parsedBooks = JSON.parse(sessionBooksData);
      if (Array.isArray(parsedBooks) && parsedBooks.length > 0) {
        console.log(`Loaded ${parsedBooks.length} books from session storage`);
        const books = parsedBooks.map(parseDateFields);
        
        const sessionRecsData = sessionStorage.getItem(RECOMMENDATIONS_STORAGE_KEY);
        const parsedRecs = sessionRecsData ? JSON.parse(sessionRecsData) : [];
        const recommendations = parsedRecs.map(parseDateFields);
        
        // Save back to localStorage
        saveToStorage(books, recommendations);
        
        return { books, recommendations };
      }
    }
    
    // If all else fails, try to find any versioned backups
    const versionedBackups = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('bookshelf_backup_')) {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            const parsed = JSON.parse(data);
            if (parsed && parsed.timestamp && parsed.books) {
              versionedBackups.push({
                key,
                timestamp: new Date(parsed.timestamp),
                data: parsed
              });
            }
          }
        } catch (e) {
          console.error(`Error parsing versioned backup ${key}:`, e);
        }
      }
    }
    
    if (versionedBackups.length > 0) {
      // Sort by timestamp, newest first
      versionedBackups.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      const latest = versionedBackups[0].data;
      
      console.log(`Loaded ${latest.books.length} books from versioned backup ${versionedBackups[0].key}`);
      const books = latest.books.map(parseDateFields);
      const recommendations = (latest.recommendations || []).map(parseDateFields);
      
      // Save back to primary storage
      saveToStorage(books, recommendations);
      
      return { books, recommendations };
    }
    
    console.log('No valid data found in any storage location');
    return { books: [], recommendations: [] };
  } catch (error) {
    console.error('Failed to load from storage:', error);
    return { books: [], recommendations: [] };
  }
};

// Verify all books have valid fields
const validateBook = (book: any): Book => {
  return {
    id: book.id || uuidv4(),
    title: book.title || 'Untitled Book',
    author: book.author || 'Unknown Author',
    coverUrl: book.coverUrl || null,
    status: book.status || 'read',
    progress: typeof book.progress === 'number' ? book.progress : (book.status === 'read' ? 100 : 0),
    pages: book.pages || 0,
    genres: Array.isArray(book.genres) ? book.genres : [],
    favorite: !!book.favorite,
    color: book.color || null,
    dateRead: book.dateRead ? new Date(book.dateRead) : new Date(),
    recommendedBy: book.recommendedBy || undefined
  };
};

export const BookshelfProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [recommendations, setRecommendations] = useState<Book[]>([]);
  const [hasBackup, setHasBackup] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Use refs to track state without rerenders
  const booksRef = useRef<Book[]>([]);
  const recommendationsRef = useRef<Book[]>([]);
  const saveTimeoutRef = useRef<number | null>(null);
  const didInitialLoad = useRef(false);

  // Load data on initial mount
  useEffect(() => {
    if (didInitialLoad.current) return;
    
    const loadData = () => {
      console.log('Initial data load starting');
      setIsLoading(true);
      
      try {
        const { books: loadedBooks, recommendations: loadedRecs } = loadFromStorage();
        
        if (loadedBooks.length > 0) {
          console.log(`Setting initial state with ${loadedBooks.length} books`);
          setBooks(loadedBooks);
          booksRef.current = loadedBooks;
        }
        
        if (loadedRecs.length > 0) {
          console.log(`Setting initial state with ${loadedRecs.length} recommendations`);
          setRecommendations(loadedRecs);
          recommendationsRef.current = loadedRecs;
        }
        
        setHasBackup(true);
        toast.success(`Loaded ${loadedBooks.length} books from storage`);
      } catch (error) {
        console.error('Error during initial data load:', error);
        toast.error('Could not load books from storage');
      } finally {
        setIsLoading(false);
        didInitialLoad.current = true;
      }
    };
    
    // Load immediately
    loadData();
    
    // Also add a safety delay in case there are race conditions with React hydration
    const safetyTimeout = setTimeout(() => {
      if (!didInitialLoad.current) {
        console.log('Safety timeout triggered for initial load');
        loadData();
      }
    }, 500);
    
    return () => clearTimeout(safetyTimeout);
  }, []);

  // Keep refs in sync with state
  useEffect(() => {
    booksRef.current = books;
  }, [books]);
  
  useEffect(() => {
    recommendationsRef.current = recommendations;
  }, [recommendations]);

  // Save data whenever books or recommendations change
  useEffect(() => {
    if (isLoading) return;
    
    // Clear any pending save timeout
    if (saveTimeoutRef.current !== null) {
      window.clearTimeout(saveTimeoutRef.current);
    }
    
    // Schedule a new save
    saveTimeoutRef.current = window.setTimeout(() => {
      const savedSuccessfully = saveToStorage(booksRef.current, recommendationsRef.current);
      setHasBackup(savedSuccessfully);
      saveTimeoutRef.current = null;
    }, 300); // Debounce saves to prevent too many writes
    
    // Force an immediate save for critical operations
    const forceSave = saveToStorage(books, recommendations);
    setHasBackup(forceSave);
    
    return () => {
      if (saveTimeoutRef.current !== null) {
        window.clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [books, recommendations, isLoading]);

  // Set up periodic saves as an additional safety measure
  useEffect(() => {
    if (isLoading) return;
    
    const intervalId = setInterval(() => {
      console.log('Performing periodic save');
      saveToStorage(booksRef.current, recommendationsRef.current);
    }, 60000); // Every minute
    
    return () => clearInterval(intervalId);
  }, [isLoading]);

  // Add a beforeunload event to ensure data is saved before the page closes
  useEffect(() => {
    const handleBeforeUnload = () => {
      console.log('Page unloading, saving data');
      saveToStorage(booksRef.current, recommendationsRef.current);
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Listen for storage events from other tabs
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === BOOKS_STORAGE_KEY && event.newValue) {
        try {
          const parsedBooks = JSON.parse(event.newValue);
          if (Array.isArray(parsedBooks) && parsedBooks.length > 0) {
            console.log(`Storage event: received ${parsedBooks.length} books from another tab`);
            
            // Only update if we have more books in the other tab
            if (parsedBooks.length > books.length) {
              setBooks(parsedBooks.map(parseDateFields));
            }
          }
        } catch (error) {
          console.error('Failed to parse books from storage event:', error);
        }
      }
      
      if (event.key === RECOMMENDATIONS_STORAGE_KEY && event.newValue) {
        try {
          const parsedRecs = JSON.parse(event.newValue);
          if (Array.isArray(parsedRecs) && parsedRecs.length > 0) {
            console.log(`Storage event: received ${parsedRecs.length} recommendations from another tab`);
            
            // Only update if we have more recommendations in the other tab
            if (parsedRecs.length > recommendations.length) {
              setRecommendations(parsedRecs.map(parseDateFields));
            }
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
  }, [books.length, recommendations.length]);

  // Recover data function - completely redesigned
  const recoverData = () => {
    console.log('Recovery function called');
    
    try {
      // Force a complete reload from all storage mechanisms
      const { books: recoveredBooks, recommendations: recoveredRecs } = loadFromStorage();
      
      if (recoveredBooks.length > books.length) {
        console.log(`Recovered ${recoveredBooks.length} books (current: ${books.length})`);
        setBooks(recoveredBooks);
        toast.success(`Recovered ${recoveredBooks.length} books!`);
      } else if (recoveredBooks.length === books.length) {
        console.log(`Same number of books in current state and storage (${books.length})`);
        toast.info(`Your books are already up to date (${books.length} books)`);
      } else {
        console.log(`Current collection has more books (${books.length}) than recovered (${recoveredBooks.length})`);
        
        // In this case, we should save the current state as it has more books
        saveToStorage(books, recommendations);
        toast.info(`Saved current collection of ${books.length} books`);
      }
      
      if (recoveredRecs.length > recommendations.length) {
        console.log(`Recovered ${recoveredRecs.length} recommendations (current: ${recommendations.length})`);
        setRecommendations(recoveredRecs);
        
        if (recoveredRecs.length > 0) {
          toast.success(`Recovered ${recoveredRecs.length} recommendations!`);
        }
      }
      
      setHasBackup(true);
    } catch (error) {
      console.error('Recovery operation failed:', error);
      toast.error('Recovery failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  // Book management functions
  const addBook = (book: Omit<Book, 'id'>) => {
    try {
      // Generate a color if not provided
      const bookColor = book.color || 
        ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'][
          Math.floor(Math.random() * 6)
        ];
      
      const newBook: Book = validateBook({
        ...book,
        id: uuidv4(),
        color: bookColor,
        dateRead: book.dateRead || new Date()
      });
      
      console.log('Adding book:', newBook.title);
      
      if (book.status === 'recommendation') {
        const updatedRecs = [newBook, ...recommendations];
        setRecommendations(updatedRecs);
        recommendationsRef.current = updatedRecs;
        toast.success('Thank you for your recommendation!');
      } else {
        const updatedBooks = [newBook, ...books];
        setBooks(updatedBooks);
        booksRef.current = updatedBooks;
        toast.success('Book added to your shelf!');
      }
      
      // Force an immediate save
      setTimeout(() => {
        const toSave = book.status === 'recommendation' 
          ? { books, recommendations: [newBook, ...recommendations] } 
          : { books: [newBook, ...books], recommendations };
          
        saveToStorage(toSave.books, toSave.recommendations);
      }, 0);
    } catch (error) {
      console.error('Error adding book:', error);
      toast.error('Failed to add book: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const removeBook = (id: string) => {
    try {
      // Check if it's in the main bookshelf
      if (books.some(book => book.id === id)) {
        console.log('Removing book:', id);
        const updatedBooks = books.filter(book => book.id !== id);
        setBooks(updatedBooks);
        booksRef.current = updatedBooks;
        
        // Force immediate save
        saveToStorage(updatedBooks, recommendations);
        toast.info('Book removed from your shelf');
      } 
      // Check if it's in recommendations
      else if (recommendations.some(rec => rec.id === id)) {
        console.log('Removing recommendation:', id);
        const updatedRecs = recommendations.filter(rec => rec.id !== id);
        setRecommendations(updatedRecs);
        recommendationsRef.current = updatedRecs;
        
        // Force immediate save
        saveToStorage(books, updatedRecs);
        toast.info('Recommendation removed');
      }
    } catch (error) {
      console.error('Error removing book:', error);
      toast.error('Failed to remove book: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const editBook = (id: string, bookData: Partial<Book>) => {
    try {
      // First check if it's in the main bookshelf
      if (books.some(book => book.id === id)) {
        console.log('Editing book:', id);
        const updatedBooks = books.map(book => 
          book.id === id ? validateBook({ ...book, ...bookData }) : book
        );
        setBooks(updatedBooks);
        booksRef.current = updatedBooks;
        
        // Force immediate save
        saveToStorage(updatedBooks, recommendations);
        toast.success('Book updated successfully!');
      } 
      // Then check if it's in recommendations
      else if (recommendations.some(rec => rec.id === id)) {
        console.log('Editing recommendation:', id);
        const updatedRecs = recommendations.map(rec => 
          rec.id === id ? validateBook({ ...rec, ...bookData }) : rec
        );
        setRecommendations(updatedRecs);
        recommendationsRef.current = updatedRecs;
        
        // Force immediate save
        saveToStorage(books, updatedRecs);
        toast.success('Recommendation updated!');
      }
    } catch (error) {
      console.error('Error editing book:', error);
      toast.error('Failed to update book: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const updateProgress = (id: string, progress: number) => {
    try {
      console.log('Updating progress for book:', id, 'to', progress);
      const updatedBooks = books.map(book =>
        book.id === id 
          ? validateBook({ 
              ...book, 
              progress,
              // Update status based on progress
              status: progress === 100 ? 'read' : 'reading'
            }) 
          : book
      );
      
      setBooks(updatedBooks);
      booksRef.current = updatedBooks;
      
      // Force immediate save
      saveToStorage(updatedBooks, recommendations);
      toast.success('Reading progress updated!');
    } catch (error) {
      console.error('Error updating progress:', error);
      toast.error('Failed to update progress: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const toggleFavorite = (id: string) => {
    try {
      // Check if it's in the main bookshelf
      if (books.some(book => book.id === id)) {
        console.log('Toggling favorite for book:', id);
        const updatedBooks = books.map(book => 
          book.id === id ? { ...book, favorite: !book.favorite } : book
        );
        
        setBooks(updatedBooks);
        booksRef.current = updatedBooks;
        
        // Force immediate save
        saveToStorage(updatedBooks, recommendations);
        toast.success('Favorite status updated!');
      } 
      // Then check if it's in recommendations
      else if (recommendations.some(rec => rec.id === id)) {
        console.log('Toggling favorite for recommendation:', id);
        const updatedRecs = recommendations.map(rec => 
          rec.id === id ? { ...rec, favorite: !rec.favorite } : rec
        );
        
        setRecommendations(updatedRecs);
        recommendationsRef.current = updatedRecs;
        
        // Force immediate save
        saveToStorage(books, updatedRecs);
        toast.success('Favorite status updated!');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorite status: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const reorderBooks = (currentOrder: string[], newOrder: string[]) => {
    try {
      console.log('Reordering books');
      const updatedBooks = [...books];
      
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
      
      setBooks(updatedBooks);
      booksRef.current = updatedBooks;
      
      // Force immediate save
      saveToStorage(updatedBooks, recommendations);
      toast.success('Books reordered successfully!');
    } catch (error) {
      console.error('Error reordering books:', error);
      toast.error('Failed to reorder books: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  // Return the context value
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

  // Show loading state if we're still loading initial data
  if (isLoading) {
    return (
      <BookshelfContext.Provider value={value}>
        {children}
      </BookshelfContext.Provider>
    );
  }

  return (
    <BookshelfContext.Provider value={value}>
      {children}
    </BookshelfContext.Provider>
  );
};
