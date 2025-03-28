
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

// Define database name and version for consistency
const DB_NAME = 'bookshelfData';
const DB_VERSION = 1;
const BOOKS_STORE = 'books';
const RECOMMENDATIONS_STORE = 'recommendations';

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

// Initialize IndexedDB
const initializeDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    try {
      if (!window.indexedDB) {
        console.error('IndexedDB not supported by browser');
        reject("IndexedDB not supported");
        return;
      }
      
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onupgradeneeded = (event) => {
        const db = request.result;
        
        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains(BOOKS_STORE)) {
          db.createObjectStore(BOOKS_STORE, { keyPath: 'id' });
          console.log(`Created ${BOOKS_STORE} store`);
        }
        
        if (!db.objectStoreNames.contains(RECOMMENDATIONS_STORE)) {
          db.createObjectStore(RECOMMENDATIONS_STORE, { keyPath: 'id' });
          console.log(`Created ${RECOMMENDATIONS_STORE} store`);
        }
        
        console.log('IndexedDB schema upgraded to version', DB_VERSION);
      };
      
      request.onsuccess = () => {
        console.log('IndexedDB connection opened successfully');
        resolve(request.result);
      };
      
      request.onerror = () => {
        console.error('Error opening IndexedDB:', request.error);
        reject(request.error);
      };
    } catch (error) {
      console.error('Exception during IndexedDB initialization:', error);
      reject(error);
    }
  });
};

// Save books to IndexedDB
const saveToIndexedDB = async (books: Book[], recommendations: Book[]): Promise<boolean> => {
  try {
    const db = await initializeDB();
    
    // Prepare books for storage (clone and handle Date objects)
    const booksToStore = books.map(book => ({
      ...book,
      dateRead: book.dateRead instanceof Date ? book.dateRead.toISOString() : book.dateRead
    }));
    
    const recsToStore = recommendations.map(rec => ({
      ...rec,
      dateRead: rec.dateRead instanceof Date ? rec.dateRead.toISOString() : rec.dateRead
    }));
    
    // Save books
    const booksTx = db.transaction([BOOKS_STORE], 'readwrite');
    const booksStore = booksTx.objectStore(BOOKS_STORE);
    
    // Clear existing data first
    await new Promise<void>((resolve, reject) => {
      const clearRequest = booksStore.clear();
      clearRequest.onsuccess = () => resolve();
      clearRequest.onerror = () => reject(clearRequest.error);
    });
    
    // Add all books
    for (const book of booksToStore) {
      booksStore.put(book);
    }
    
    // Save recommendations
    const recsTx = db.transaction([RECOMMENDATIONS_STORE], 'readwrite');
    const recsStore = recsTx.objectStore(RECOMMENDATIONS_STORE);
    
    // Clear existing recommendations
    await new Promise<void>((resolve, reject) => {
      const clearRequest = recsStore.clear();
      clearRequest.onsuccess = () => resolve();
      clearRequest.onerror = () => reject(clearRequest.error);
    });
    
    // Add all recommendations
    for (const rec of recsToStore) {
      recsStore.put(rec);
    }
    
    // Wait for transactions to complete
    await Promise.all([
      new Promise<void>((resolve, reject) => {
        booksTx.oncomplete = () => {
          console.log(`Saved ${booksToStore.length} books to IndexedDB`);
          resolve();
        };
        booksTx.onerror = () => reject(booksTx.error);
      }),
      new Promise<void>((resolve, reject) => {
        recsTx.oncomplete = () => {
          console.log(`Saved ${recsToStore.length} recommendations to IndexedDB`);
          resolve();
        };
        recsTx.onerror = () => reject(recsTx.error);
      })
    ]);
    
    db.close();
    return true;
  } catch (error) {
    console.error('Failed to save to IndexedDB:', error);
    return false;
  }
};

// Load books from IndexedDB
const loadFromIndexedDB = async (): Promise<{ books: Book[], recommendations: Book[] }> => {
  try {
    const db = await initializeDB();
    
    // Load books
    const books = await new Promise<Book[]>((resolve, reject) => {
      try {
        if (!db.objectStoreNames.contains(BOOKS_STORE)) {
          console.log(`${BOOKS_STORE} store doesn't exist yet`);
          resolve([]);
          return;
        }
        
        const tx = db.transaction([BOOKS_STORE], 'readonly');
        const store = tx.objectStore(BOOKS_STORE);
        const request = store.getAll();
        
        request.onsuccess = () => {
          const loadedBooks = request.result || [];
          console.log(`Loaded ${loadedBooks.length} books from IndexedDB`);
          resolve(loadedBooks.map((book: any) => parseDateFields(book)));
        };
        
        request.onerror = () => {
          console.error('Error loading books from IndexedDB:', request.error);
          reject(request.error);
        };
      } catch (error) {
        console.error('Exception during books load from IndexedDB:', error);
        reject(error);
      }
    });
    
    // Load recommendations
    const recommendations = await new Promise<Book[]>((resolve, reject) => {
      try {
        if (!db.objectStoreNames.contains(RECOMMENDATIONS_STORE)) {
          console.log(`${RECOMMENDATIONS_STORE} store doesn't exist yet`);
          resolve([]);
          return;
        }
        
        const tx = db.transaction([RECOMMENDATIONS_STORE], 'readonly');
        const store = tx.objectStore(RECOMMENDATIONS_STORE);
        const request = store.getAll();
        
        request.onsuccess = () => {
          const loadedRecs = request.result || [];
          console.log(`Loaded ${loadedRecs.length} recommendations from IndexedDB`);
          resolve(loadedRecs.map((rec: any) => parseDateFields(rec)));
        };
        
        request.onerror = () => {
          console.error('Error loading recommendations from IndexedDB:', request.error);
          reject(request.error);
        };
      } catch (error) {
        console.error('Exception during recommendations load from IndexedDB:', error);
        reject(error);
      }
    });
    
    db.close();
    return { books, recommendations };
  } catch (error) {
    console.error('Failed to load from IndexedDB:', error);
    return { books: [], recommendations: [] };
  }
};

// Create backup of data in localStorage and IndexedDB
const backupData = async (books: Book[], recommendations: Book[]) => {
  try {
    // Prepare data for storage
    const booksToStore = books.map(book => ({
      ...book,
      dateRead: book.dateRead instanceof Date ? book.dateRead.toISOString() : book.dateRead
    }));
    
    const recsToStore = recommendations.map(rec => ({
      ...rec,
      dateRead: rec.dateRead instanceof Date ? rec.dateRead.toISOString() : rec.dateRead
    }));
    
    // Save to localStorage
    localStorage.setItem('books_backup', JSON.stringify(booksToStore));
    localStorage.setItem('recommendations_backup', JSON.stringify(recsToStore));
    localStorage.setItem('backup_timestamp', new Date().toISOString());
    
    console.log('Data backup created:', booksToStore.length, 'books,', recsToStore.length, 'recommendations');
    
    // Store a copy in sessionStorage as well for additional redundancy
    sessionStorage.setItem('books_backup', JSON.stringify(booksToStore));
    sessionStorage.setItem('recommendations_backup', JSON.stringify(recsToStore));
    
    // Also back up to IndexedDB
    await saveToIndexedDB(books, recommendations);
    
    return true;
  } catch (error) {
    console.error('Failed to create backup:', error);
    return false;
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
    
    return !!(backupTimestamp && (booksBackup || sessionBooksBackup));
  } catch (error) {
    console.error('Error checking for backup data:', error);
    return false;
  }
};

export const BookshelfProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [recommendations, setRecommendations] = useState<Book[]>([]);
  const [hasBackup, setHasBackup] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initial load from all storage sources
  useEffect(() => {
    const loadAllData = async () => {
      setIsLoading(true);
      console.log('Initial data load started');

      try {
        // Try to load from IndexedDB first (most reliable)
        const idbData = await loadFromIndexedDB();
        let finalBooks: Book[] = [];
        let finalRecs: Book[] = [];
        
        if (idbData.books.length > 0) {
          console.log(`Loaded ${idbData.books.length} books from IndexedDB`);
          finalBooks = idbData.books;
        } else {
          // If no IndexedDB data, try localStorage
          const localBooks = loadBooksFromStorage();
          console.log(`Loaded ${localBooks.length} books from localStorage`);
          
          if (localBooks.length > 0) {
            finalBooks = localBooks;
          } else {
            // Try backups if main storage is empty
            const backupBooks = localStorage.getItem('books_backup');
            if (backupBooks) {
              try {
                const parsedBooks = JSON.parse(backupBooks);
                if (Array.isArray(parsedBooks) && parsedBooks.length > 0) {
                  console.log(`Recovered ${parsedBooks.length} books from backup`);
                  finalBooks = parsedBooks.map((book: any) => parseDateFields(book));
                }
              } catch (error) {
                console.error('Error parsing backup books:', error);
              }
            }
          }
        }
        
        // Same process for recommendations
        if (idbData.recommendations.length > 0) {
          console.log(`Loaded ${idbData.recommendations.length} recommendations from IndexedDB`);
          finalRecs = idbData.recommendations;
        } else {
          const localRecs = loadRecommendationsFromStorage();
          console.log(`Loaded ${localRecs.length} recommendations from localStorage`);
          
          if (localRecs.length > 0) {
            finalRecs = localRecs;
          } else {
            const backupRecs = localStorage.getItem('recommendations_backup');
            if (backupRecs) {
              try {
                const parsedRecs = JSON.parse(backupRecs);
                if (Array.isArray(parsedRecs) && parsedRecs.length > 0) {
                  console.log(`Recovered ${parsedRecs.length} recommendations from backup`);
                  finalRecs = parsedRecs.map((rec: any) => parseDateFields(rec));
                }
              } catch (error) {
                console.error('Error parsing backup recommendations:', error);
              }
            }
          }
        }
        
        // Set state with our loaded data
        setBooks(finalBooks);
        setRecommendations(finalRecs);
        
        // Create a backup of whatever we loaded to ensure it's saved everywhere
        if (finalBooks.length > 0 || finalRecs.length > 0) {
          await backupData(finalBooks, finalRecs);
          saveBooksToLocalStorage(finalBooks);
          saveRecommendationsToLocalStorage(finalRecs);
          setHasBackup(true);
        }
        
        console.log('Initial data load completed with', finalBooks.length, 'books and', finalRecs.length, 'recommendations');
      } catch (error) {
        console.error('Error during initial data load:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadAllData();
  }, []);

  // Save books to localStorage
  const saveBooksToLocalStorage = (booksToSave: Book[]) => {
    try {
      const booksToStore = booksToSave.map(book => ({
        ...book,
        dateRead: book.dateRead instanceof Date ? book.dateRead.toISOString() : book.dateRead
      }));
      
      localStorage.setItem('books', JSON.stringify(booksToStore));
      console.log('Saved books to localStorage:', booksToStore.length);
      return true;
    } catch (error) {
      console.error('Failed to save books to localStorage:', error);
      return false;
    }
  };

  // Save recommendations to localStorage
  const saveRecommendationsToLocalStorage = (recsToSave: Book[]) => {
    try {
      const recsToStore = recsToSave.map(rec => ({
        ...rec,
        dateRead: rec.dateRead instanceof Date ? rec.dateRead.toISOString() : rec.dateRead
      }));
      
      localStorage.setItem('recommendations', JSON.stringify(recsToStore));
      console.log('Saved recommendations to localStorage:', recsToStore.length);
      return true;
    } catch (error) {
      console.error('Failed to save recommendations to localStorage:', error);
      return false;
    }
  };

  // Save books to all storage mechanisms whenever they change
  useEffect(() => {
    if (isLoading || books.length === 0) return;
    
    const saveAllBooks = async () => {
      console.log('Saving', books.length, 'books to all storage mechanisms');
      
      // Save to localStorage (fastest, but less reliable)
      const localSaved = saveBooksToLocalStorage(books);
      
      // Save to IndexedDB (more reliable, but slower)
      const idbSaved = await saveToIndexedDB(books, recommendations);
      
      // Create backups
      const backupCreated = await backupData(books, recommendations);
      
      if (localSaved && idbSaved && backupCreated) {
        console.log('Successfully saved books to all storage mechanisms');
        setHasBackup(true);
      } else {
        console.warn('Some storage mechanisms failed when saving books');
      }
    };
    
    saveAllBooks();
  }, [books, isLoading]);

  // Save recommendations to all storage mechanisms whenever they change
  useEffect(() => {
    if (isLoading || recommendations.length === 0) return;
    
    const saveAllRecs = async () => {
      console.log('Saving', recommendations.length, 'recommendations to all storage mechanisms');
      
      // Save to localStorage
      const localSaved = saveRecommendationsToLocalStorage(recommendations);
      
      // Save to IndexedDB
      const idbSaved = await saveToIndexedDB(books, recommendations);
      
      // Create backups
      const backupCreated = await backupData(books, recommendations);
      
      if (localSaved && idbSaved && backupCreated) {
        console.log('Successfully saved recommendations to all storage mechanisms');
        setHasBackup(true);
      } else {
        console.warn('Some storage mechanisms failed when saving recommendations');
      }
    };
    
    saveAllRecs();
  }, [recommendations, books, isLoading]);

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

  // Verify storage integrity periodically
  useEffect(() => {
    const verifyDataIntegrity = async () => {
      try {
        // Check if IndexedDB data matches our state
        const idbData = await loadFromIndexedDB();
        const storedBooks = localStorage.getItem('books');
        const parsedStoredBooks = storedBooks ? JSON.parse(storedBooks) : [];
        
        // If we have books in state but not in storage, save them again
        if (books.length > 0 && (idbData.books.length < books.length || parsedStoredBooks.length < books.length)) {
          console.log('Data integrity check: Detected missing books in storage, saving again');
          await saveToIndexedDB(books, recommendations);
          saveBooksToLocalStorage(books);
          saveRecommendationsToLocalStorage(recommendations);
          await backupData(books, recommendations);
        }
        
        setHasBackup(true);
      } catch (error) {
        console.error('Error verifying data integrity:', error);
      }
    };
    
    // Verify immediately and then every 30 seconds
    verifyDataIntegrity();
    const intervalId = setInterval(verifyDataIntegrity, 30000);
    
    return () => clearInterval(intervalId);
  }, [books, recommendations]);

  const recoverData = async () => {
    console.log('Recovery function called');
    setIsLoading(true);
    
    try {
      // Try all possible data sources
      const idbData = await loadFromIndexedDB();
      let recoveredBooks: Book[] = [];
      let recoveredRecs: Book[] = [];
      
      // Check IndexedDB data
      if (idbData.books.length > 0) {
        console.log(`Found ${idbData.books.length} books in IndexedDB`);
        recoveredBooks = idbData.books;
      }
      
      if (idbData.recommendations.length > 0) {
        console.log(`Found ${idbData.recommendations.length} recommendations in IndexedDB`);
        recoveredRecs = idbData.recommendations;
      }
      
      // Check localStorage backups if IndexedDB didn't have data
      if (recoveredBooks.length === 0) {
        const backupBooks = localStorage.getItem('books_backup');
        if (backupBooks) {
          try {
            const parsedBooks = JSON.parse(backupBooks);
            if (Array.isArray(parsedBooks) && parsedBooks.length > 0) {
              console.log(`Found ${parsedBooks.length} books in localStorage backup`);
              recoveredBooks = parsedBooks.map((book: any) => parseDateFields(book));
            }
          } catch (error) {
            console.error('Error parsing backup books:', error);
          }
        }
      }
      
      if (recoveredRecs.length === 0) {
        const backupRecs = localStorage.getItem('recommendations_backup');
        if (backupRecs) {
          try {
            const parsedRecs = JSON.parse(backupRecs);
            if (Array.isArray(parsedRecs) && parsedRecs.length > 0) {
              console.log(`Found ${parsedRecs.length} recommendations in localStorage backup`);
              recoveredRecs = parsedRecs.map((rec: any) => parseDateFields(rec));
            }
          } catch (error) {
            console.error('Error parsing backup recommendations:', error);
          }
        }
      }
      
      // Check sessionStorage as last resort
      if (recoveredBooks.length === 0) {
        const sessionBackup = sessionStorage.getItem('books_backup');
        if (sessionBackup) {
          try {
            const parsedBooks = JSON.parse(sessionBackup);
            if (Array.isArray(parsedBooks) && parsedBooks.length > 0) {
              console.log(`Found ${parsedBooks.length} books in sessionStorage backup`);
              recoveredBooks = parsedBooks.map((book: any) => parseDateFields(book));
            }
          } catch (error) {
            console.error('Error parsing sessionStorage backup books:', error);
          }
        }
      }
      
      // Use recovered data if it's better than what we have
      if (recoveredBooks.length > books.length) {
        console.log(`Recovering ${recoveredBooks.length} books (current: ${books.length})`);
        setBooks(recoveredBooks);
        toast.success(`Recovered ${recoveredBooks.length} books from backup`);
        
        // Force immediate storage update
        saveBooksToLocalStorage(recoveredBooks);
        await saveToIndexedDB(recoveredBooks, recoveredRecs);
      } else {
        console.log(`Current collection has more books (${books.length}) than backup (${recoveredBooks.length})`);
        toast.info(`Current collection (${books.length} books) appears more complete than backup`);
      }
      
      if (recoveredRecs.length > recommendations.length) {
        console.log(`Recovering ${recoveredRecs.length} recommendations (current: ${recommendations.length})`);
        setRecommendations(recoveredRecs);
        
        if (recoveredRecs.length > 0) {
          toast.success(`Recovered ${recoveredRecs.length} recommendations from backup`);
        }
        
        // Force immediate storage update
        saveRecommendationsToLocalStorage(recoveredRecs);
      }
      
      // Create a fresh backup of whatever we have now
      await backupData(
        recoveredBooks.length > books.length ? recoveredBooks : books,
        recoveredRecs.length > recommendations.length ? recoveredRecs : recommendations
      );
      
      setHasBackup(true);
    } catch (error) {
      console.error('Failed to recover data from backup:', error);
      toast.error('Failed to recover data from backup: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
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
      color: bookColor,
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
