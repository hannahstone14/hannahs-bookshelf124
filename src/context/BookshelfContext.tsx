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
    
    // Initialize IndexedDB for more robust storage
    try {
      const initializeDB = () => {
        return new Promise<IDBDatabase>((resolve, reject) => {
          if (!window.indexedDB) {
            reject("IndexedDB not supported");
            return;
          }
          
          const request = window.indexedDB.open('bookshelfBackup', 1);
          
          request.onupgradeneeded = (event) => {
            const db = request.result;
            if (!db.objectStoreNames.contains('books')) {
              db.createObjectStore('books', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('recommendations')) {
              db.createObjectStore('recommendations', { keyPath: 'id' });
            }
            console.log('IndexedDB schema upgraded');
          };
          
          request.onsuccess = () => {
            console.log('IndexedDB opened successfully');
            resolve(request.result);
          };
          
          request.onerror = (event) => {
            console.error('Error opening IndexedDB:', request.error);
            reject(request.error);
          };
        });
      };
      
      initializeDB().then(db => {
        const transaction = db.transaction(['books', 'recommendations'], 'readwrite');
        
        const booksStore = transaction.objectStore('books');
        const recsStore = transaction.objectStore('recommendations');
        
        // Clear existing data
        booksStore.clear();
        recsStore.clear();
        
        // Add all books one by one to avoid transaction issues
        booksToStore.forEach(book => {
          booksStore.add(book);
        });
        
        // Add all recommendations
        recsToStore.forEach(rec => {
          recsStore.add(rec);
        });
        
        transaction.oncomplete = () => {
          console.log('Data successfully stored in IndexedDB');
          db.close();
        };
        
        transaction.onerror = (event) => {
          console.error('Transaction error:', transaction.error);
        };
      }).catch(error => {
        console.error('Failed to initialize IndexedDB:', error);
      });
    } catch (err) {
      console.error('IndexedDB backup failed:', err);
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
    
    // Also check IndexedDB asynchronously but return based on local storage first
    if (window.indexedDB) {
      const dbRequest = window.indexedDB.open('bookshelfBackup', 1);
      dbRequest.onsuccess = function() {
        const db = dbRequest.result;
        if (db.objectStoreNames.contains('books')) {
          return true;
        }
        db.close();
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
    return new Promise<{books: Book[], recommendations: Book[]}>((resolve) => {
      const dbRequest = window.indexedDB.open('bookshelfBackup', 1);
      
      dbRequest.onsuccess = function() {
        const db = dbRequest.result;
        let idbBooks: Book[] = [];
        let idbRecs: Book[] = [];
        let booksLoaded = false;
        let recsLoaded = false;
        
        const checkAllLoaded = () => {
          if (booksLoaded && recsLoaded) {
            if (idbBooks.length > 0) {
              console.log('Loaded', idbBooks.length, 'books from IndexedDB');
              books = idbBooks;
            }
            if (idbRecs.length > 0) {
              console.log('Loaded', idbRecs.length, 'recommendations from IndexedDB');
              recommendations = idbRecs;
            }
            db.close();
            resolve({ books, recommendations });
          }
        };
        
        if (db.objectStoreNames.contains('books')) {
          const bookTx = db.transaction('books', 'readonly');
          const bookStore = bookTx.objectStore('books');
          const bookRequest = bookStore.getAll();
          
          bookRequest.onsuccess = function() {
            if (bookRequest.result && bookRequest.result.length > 0) {
              console.log('Found backup in IndexedDB with', bookRequest.result.length, 'books');
              idbBooks = bookRequest.result.map((book: any) => parseDateFields(book));
            }
            booksLoaded = true;
            checkAllLoaded();
          };
          
          bookRequest.onerror = function() {
            console.error('Error loading books from IndexedDB:', bookRequest.error);
            booksLoaded = true;
            checkAllLoaded();
          };
        } else {
          booksLoaded = true;
          checkAllLoaded();
        }
        
        if (db.objectStoreNames.contains('recommendations')) {
          const recTx = db.transaction('recommendations', 'readonly');
          const recStore = recTx.objectStore('recommendations');
          const recRequest = recStore.getAll();
          
          recRequest.onsuccess = function() {
            if (recRequest.result && recRequest.result.length > 0) {
              console.log('Found backup in IndexedDB with', recRequest.result.length, 'recommendations');
              idbRecs = recRequest.result.map((rec: any) => parseDateFields(rec));
            }
            recsLoaded = true;
            checkAllLoaded();
          };
          
          recRequest.onerror = function() {
            console.error('Error loading recommendations from IndexedDB:', recRequest.error);
            recsLoaded = true;
            checkAllLoaded();
          };
        } else {
          recsLoaded = true;
          checkAllLoaded();
        }
      };
      
      dbRequest.onerror = function() {
        console.error('Error opening IndexedDB:', dbRequest.error);
        resolve({ books, recommendations });
      };
      
      // Handle the case where the database doesn't exist yet
      dbRequest.onupgradeneeded = function() {
        console.log('IndexedDB needs upgrade, no existing data');
        const db = dbRequest.result;
        if (!db.objectStoreNames.contains('books')) {
          db.createObjectStore('books', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('recommendations')) {
          db.createObjectStore('recommendations', { keyPath: 'id' });
        }
      };
    }).then(result => {
      return result;
    }).catch(error => {
      console.error('Failed to load from IndexedDB:', error);
      return { books, recommendations };
    });
  }
  
  return { books, recommendations };
};

export const BookshelfProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [books, setBooks] = useState<Book[]>(() => {
    const loadedBooks = loadBooksFromStorage();
    console.log('Initial load found', loadedBooks.length, 'books in localStorage');
    
    if (loadedBooks.length === 0) {
      // If no books in main storage, try to recover from backup immediately
      console.log('No books found in main storage, attempting recovery from backup');
      try {
        // Synchronously try localStorage backup first for immediate rendering
        const backupBooks = localStorage.getItem('books_backup');
        if (backupBooks) {
          const parsedBooks = JSON.parse(backupBooks);
          if (Array.isArray(parsedBooks) && parsedBooks.length > 0) {
            console.log('Recovered', parsedBooks.length, 'books from localStorage backup');
            return parsedBooks.map((book: any) => parseDateFields(book));
          }
        }
        
        // Return empty array, but we'll try other backups asynchronously
        return [];
      } catch (error) {
        console.error('Failed to recover from backup:', error);
        return [];
      }
    }
    return loadedBooks;
  });
  
  const [recommendations, setRecommendations] = useState<Book[]>(() => {
    const loadedRecs = loadRecommendationsFromStorage();
    if (loadedRecs.length === 0) {
      // If no recommendations in main storage, try to recover from backup
      console.log('No recommendations found in main storage, attempting recovery from backup');
      try {
        // Synchronously try localStorage backup first
        const backupRecs = localStorage.getItem('recommendations_backup');
        if (backupRecs) {
          const parsedRecs = JSON.parse(backupRecs);
          if (Array.isArray(parsedRecs) && parsedRecs.length > 0) {
            console.log('Recovered', parsedRecs.length, 'recommendations from localStorage backup');
            return parsedRecs.map((rec: any) => parseDateFields(rec));
          }
        }
        
        // Return empty array
        return [];
      } catch (error) {
        console.error('Failed to recover recommendations from backup:', error);
        return [];
      }
    }
    return loadedRecs;
  });
  
  const [hasBackup, setHasBackup] = useState<boolean>(hasBackupData());

  // Try to load from IndexedDB asynchronously on initial load
  useEffect(() => {
    const tryAsyncBackupLoad = async () => {
      if (books.length === 0) {
        console.log('Attempting asynchronous backup recovery...');
        const result = await Promise.resolve(loadBackupData());
        
        if (result.books && result.books.length > 0) {
          console.log('Async recovery found', result.books.length, 'books');
          setBooks(result.books);
          toast.success(`Recovered ${result.books.length} books from backup storage`);
        }
        
        if (result.recommendations && result.recommendations.length > 0) {
          console.log('Async recovery found', result.recommendations.length, 'recommendations');
          setRecommendations(result.recommendations);
        }
      }
    };
    
    tryAsyncBackupLoad();
  }, [books.length]);

  // Create a backup when data is loaded initially
  useEffect(() => {
    const hasInitialData = books.length > 0 || recommendations.length > 0;
    if (hasInitialData) {
      backupData(books, recommendations);
      setHasBackup(true);
    }
  }, []);

  // Save books to localStorage whenever they change
  useEffect(() => {
    const saveBooks = () => {
      try {
        const booksToStore = books.map(book => ({
          ...book,
          // Convert Date objects to ISO strings before storing
          dateRead: book.dateRead instanceof Date ? book.dateRead.toISOString() : book.dateRead
        }));
        
        localStorage.setItem('books', JSON.stringify(booksToStore));
        console.log('Saved books to localStorage:', booksToStore.length);
        
        // Create backup immediately after saving
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
    };
    
    saveBooks();
  }, [books, recommendations]);

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
  }, [recommendations, books]);

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

  // Check for backup data periodically and verify the data persists
  useEffect(() => {
    // Initial verification
    const verify = () => {
      const storedBooks = localStorage.getItem('books');
      if (!storedBooks || JSON.parse(storedBooks).length < books.length) {
        console.log('Detected data inconsistency, rewriting localStorage');
        const booksToStore = books.map(book => ({
          ...book,
          dateRead: book.dateRead instanceof Date ? book.dateRead.toISOString() : book.dateRead
        }));
        localStorage.setItem('books', JSON.stringify(booksToStore));
      }
      
      // Create a backup if needed
      const backupExists = hasBackupData();
      setHasBackup(backupExists);
      
      if (!backupExists && (books.length > 0 || recommendations.length > 0)) {
        console.log('No backup found but data exists, creating new backup');
        backupData(books, recommendations);
        setHasBackup(true);
      } else if (books.length > 0) {
        // Always keep backup fresh with latest data
        backupData(books, recommendations);
      }
    };
    
    verify();
    
    // Set up the interval
    const intervalId = setInterval(verify, 30000); // Check every 30 seconds
    
    return () => clearInterval(intervalId);
  }, [books, recommendations]);

  const recoverData = async () => {
    console.log('Recovery function called');
    try {
      const result = await Promise.resolve(loadBackupData());
      const backupBooks = result.books;
      const backupRecs = result.recommendations;
      
      console.log('Recovery found:', backupBooks.length, 'books and', backupRecs.length, 'recommendations');
      
      if (backupBooks.length > 0 || backupRecs.length > 0) {
        // Use the backup that has more items
        if (backupBooks.length >= books.length) {
          setBooks(backupBooks);
          console.log('Books recovered:', backupBooks.length);
          toast.success(`Recovered ${backupBooks.length} books from backup`);
          
          // Force immediate localStorage update
          const booksToStore = backupBooks.map(book => ({
            ...book,
            dateRead: book.dateRead instanceof Date ? book.dateRead.toISOString() : book.dateRead
          }));
          localStorage.setItem('books', JSON.stringify(booksToStore));
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
          
          // Force immediate localStorage update
          const recsToStore = backupRecs.map(rec => ({
            ...rec,
            dateRead: rec.dateRead instanceof Date ? rec.dateRead.toISOString() : rec.dateRead
          }));
          localStorage.setItem('recommendations', JSON.stringify(recsToStore));
        } else {
          console.log('Current recommendations collection is larger than backup, not replacing');
        }
        
        // Create a fresh backup of whatever we have now
        setTimeout(() => {
          const updatedBooks = backupBooks.length >= books.length ? backupBooks : books;
          const updatedRecs = backupRecs.length >= recommendations.length ? backupRecs : recommendations;
          backupData(updatedBooks, updatedRecs);
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
