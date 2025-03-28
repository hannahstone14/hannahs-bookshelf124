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
    
    // Store a copy in sessionStorage as well for additional redundancy
    sessionStorage.setItem('books_backup', JSON.stringify(booksToStore));
    sessionStorage.setItem('recommendations_backup', JSON.stringify(recsToStore));
    
    // We'll also use the newer IndexedDB for more robust storage if available
    if (window.indexedDB) {
      try {
        const request = indexedDB.open('bookshelfBackup', 1);
        
        request.onupgradeneeded = function(event) {
          const db = request.result;
          if (!db.objectStoreNames.contains('books')) {
            db.createObjectStore('books', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('recommendations')) {
            db.createObjectStore('recommendations', { keyPath: 'id' });
          }
        };
        
        request.onsuccess = function() {
          const db = request.result;
          const transaction = db.transaction(['books', 'recommendations'], 'readwrite');
          
          // Clear existing data
          transaction.objectStore('books').clear();
          transaction.objectStore('recommendations').clear();
          
          // Add all books
          booksToStore.forEach(book => {
            transaction.objectStore('books').add(book);
          });
          
          // Add all recommendations
          recsToStore.forEach(rec => {
            transaction.objectStore('recommendations').add(rec);
          });
          
          console.log('Data backup also stored in IndexedDB');
        };
      } catch (err) {
        console.error('IndexedDB backup failed:', err);
      }
    }
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
  try {
    // Check multiple sources for backup data
    const backupTimestamp = localStorage.getItem('backup_timestamp');
    const booksBackup = localStorage.getItem('books_backup');
    const sessionBooksBackup = sessionStorage.getItem('books_backup');
    
    // Also check IndexedDB if available
    if (window.indexedDB) {
      const request = indexedDB.open('bookshelfBackup', 1);
      request.onsuccess = function() {
        const db = request.result;
        if (db.objectStoreNames.contains('books')) {
          return true;
        }
      };
    }
    
    return !!(backupTimestamp && (booksBackup || sessionBooksBackup));
  } catch (error) {
    console.error('Error checking for backup data:', error);
    return false;
  }
};

// Helper function to load backup data from all available sources
const loadBackupData = () => {
  console.log('Attempting to load backup data...');
  
  let books: Book[] = [];
  let recommendations: Book[] = [];
  
  // Try to recover from localStorage first
  try {
    const backupBooks = localStorage.getItem('books_backup');
    const backupRecs = localStorage.getItem('recommendations_backup');
    
    if (backupBooks) {
      const parsedBooks = JSON.parse(backupBooks);
      console.log('Found backup in localStorage with', parsedBooks.length, 'books');
      
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
    }
    
    if (backupRecs) {
      const parsedRecs = JSON.parse(backupRecs);
      console.log('Found backup in localStorage with', parsedRecs.length, 'recommendations');
      
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
    }
  } catch (error) {
    console.error('Failed to recover from localStorage backup:', error);
  }
  
  // If no books recovered yet, try sessionStorage
  if (books.length === 0) {
    try {
      const sessionBackupBooks = sessionStorage.getItem('books_backup');
      if (sessionBackupBooks) {
        const parsedBooks = JSON.parse(sessionBackupBooks);
        console.log('Found backup in sessionStorage with', parsedBooks.length, 'books');
        
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
      }
      
      const sessionBackupRecs = sessionStorage.getItem('recommendations_backup');
      if (sessionBackupRecs) {
        const parsedRecs = JSON.parse(sessionBackupRecs);
        console.log('Found backup in sessionStorage with', parsedRecs.length, 'recommendations');
        
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
      }
    } catch (error) {
      console.error('Failed to recover from sessionStorage backup:', error);
    }
  }
  
  // If still no books recovered, try IndexedDB as last resort
  if (books.length === 0 && window.indexedDB) {
    try {
      const request = indexedDB.open('bookshelfBackup', 1);
      
      request.onsuccess = function() {
        const db = request.result;
        if (db.objectStoreNames.contains('books')) {
          const transaction = db.transaction('books', 'readonly');
          const bookStore = transaction.objectStore('books');
          const getAllRequest = bookStore.getAll();
          
          getAllRequest.onsuccess = function() {
            if (getAllRequest.result && getAllRequest.result.length > 0) {
              console.log('Found backup in IndexedDB with', getAllRequest.result.length, 'books');
              books = getAllRequest.result.map((book: any) => parseDateFields(book));
            }
          };
        }
        
        if (db.objectStoreNames.contains('recommendations')) {
          const transaction = db.transaction('recommendations', 'readonly');
          const recStore = transaction.objectStore('recommendations');
          const getAllRequest = recStore.getAll();
          
          getAllRequest.onsuccess = function() {
            if (getAllRequest.result && getAllRequest.result.length > 0) {
              console.log('Found backup in IndexedDB with', getAllRequest.result.length, 'recommendations');
              recommendations = getAllRequest.result.map((rec: any) => parseDateFields(rec));
            }
          };
        }
      };
    } catch (error) {
      console.error('Failed to recover from IndexedDB backup:', error);
    }
  }
  
  return { books, recommendations };
};

export const BookshelfProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [books, setBooks] = useState<Book[]>(() => {
    const loadedBooks = loadBooksFromStorage();
    if (loadedBooks.length === 0) {
      // If no books in main storage, try to recover from backup
      console.log('No books found in main storage, attempting recovery from backup');
      const { books: backupBooks } = loadBackupData();
      return backupBooks;
    }
    return loadedBooks;
  });
  
  const [recommendations, setRecommendations] = useState<Book[]>(() => {
    const loadedRecs = loadRecommendationsFromStorage();
    if (loadedRecs.length === 0) {
      // If no recommendations in main storage, try to recover from backup
      console.log('No recommendations found in main storage, attempting recovery from backup');
      const { recommendations: backupRecs } = loadBackupData();
      return backupRecs;
    }
    return loadedRecs;
  });
  
  const [hasBackup, setHasBackup] = useState<boolean>(hasBackupData());

  // Create a backup when data is loaded initially
  useEffect(() => {
    const hasInitialData = books.length > 0 || recommendations.length > 0;
    if (hasInitialData) {
      backupData(books, recommendations);
      setHasBackup(true);
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
      // If primary save fails, try backup directly
      try {
        backupData(books, recommendations);
        setHasBackup(true);
      } catch (backupError) {
        console.error('Even backup failed:', backupError);
      }
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
      // If primary save fails, try backup directly
      try {
        backupData(books, recommendations);
        setHasBackup(true);
      } catch (backupError) {
        console.error('Even backup failed:', backupError);
      }
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
            
            // Also update the backup when data changes in another tab
            backupData(parsedBooks, recommendations);
            setHasBackup(true);
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
            
            // Also update the backup when data changes in another tab
            backupData(books, parsedRecs);
            setHasBackup(true);
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
  }, [books, recommendations]);

  // Check for backup data every minute to ensure we can recover if needed
  useEffect(() => {
    const intervalId = setInterval(() => {
      const backupExists = hasBackupData();
      setHasBackup(backupExists);
      
      if (backupExists) {
        console.log('Backup data confirmed available');
      } else if (books.length > 0 || recommendations.length > 0) {
        console.log('No backup found but data exists, creating new backup');
        backupData(books, recommendations);
        setHasBackup(true);
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(intervalId);
  }, [books, recommendations]);

  const recoverData = () => {
    console.log('Recovery function called');
    try {
      const { books: backupBooks, recommendations: backupRecs } = loadBackupData();
      
      console.log('Recovery found:', backupBooks.length, 'books and', backupRecs.length, 'recommendations');
      
      if (backupBooks.length > 0 || backupRecs.length > 0) {
        // Instead of merging, we'll replace the current data if backup has more items
        // This is safer for recovery scenarios
        if (backupBooks.length >= books.length) {
          setBooks(backupBooks);
          console.log('Books recovered:', backupBooks.length);
          toast.success(`Recovered ${backupBooks.length} books from backup`);
        } else {
          console.log('Current books collection is larger than backup, not replacing');
          toast.info(`Current collection (${books.length} books) appears more complete than backup (${backupBooks.length} books)`);
        }
        
        if (backupRecs.length >= recommendations.length) {
          setRecommendations(backupRecs);
          console.log('Recommendations recovered:', backupRecs.length);
          if (backupRecs.length > 0) {
            toast.success(`Recovered ${backupRecs.length} recommendations from backup`);
          }
        } else {
          console.log('Current recommendations collection is larger than backup, not replacing');
        }
        
        // Create a fresh backup of whatever we have now
        setTimeout(() => {
          backupData(
            backupBooks.length >= books.length ? backupBooks : books,
            backupRecs.length >= recommendations.length ? backupRecs : recommendations
          );
        }, 1000);
      } else {
        console.log('No backup data available to recover');
        toast.error('No backup data available to recover');
      }
    } catch (error) {
      console.error('Failed to recover data from backup:', error);
      toast.error('Failed to recover data from backup: ' + (error instanceof Error ? error.message : 'Unknown error'));
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
