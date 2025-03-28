
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
const DB_NAME = 'bookshelfAppData';
const DB_VERSION = 2; // Increased version to trigger schema update
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

// Initialize IndexedDB with proper error handling
const initializeDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    try {
      if (!window.indexedDB) {
        console.error('IndexedDB not supported by browser');
        reject(new Error("IndexedDB not supported"));
        return;
      }
      
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onupgradeneeded = (event) => {
        const db = request.result;
        
        // Clear old stores if they exist (for clean upgrade)
        if (db.objectStoreNames.contains(BOOKS_STORE)) {
          db.deleteObjectStore(BOOKS_STORE);
        }
        
        if (db.objectStoreNames.contains(RECOMMENDATIONS_STORE)) {
          db.deleteObjectStore(RECOMMENDATIONS_STORE);
        }
        
        // Create fresh object stores
        db.createObjectStore(BOOKS_STORE, { keyPath: 'id' });
        console.log(`Created ${BOOKS_STORE} store`);
        
        db.createObjectStore(RECOMMENDATIONS_STORE, { keyPath: 'id' });
        console.log(`Created ${RECOMMENDATIONS_STORE} store`);
        
        console.log('IndexedDB schema upgraded to version', DB_VERSION);
      };
      
      request.onsuccess = () => {
        console.log('IndexedDB connection opened successfully');
        resolve(request.result);
      };
      
      request.onerror = () => {
        console.error('Error opening IndexedDB:', request.error);
        reject(request.error || new Error('Failed to open IndexedDB'));
      };
    } catch (error) {
      console.error('Exception during IndexedDB initialization:', error);
      reject(error);
    }
  });
};

// Save books to IndexedDB with better error handling
const saveToIndexedDB = async (books: Book[], recommendations: Book[]): Promise<boolean> => {
  let db: IDBDatabase | null = null;
  try {
    db = await initializeDB();
    
    // Prepare books for storage (clone and handle Date objects)
    const booksToStore = books.map(book => ({
      ...book,
      dateRead: book.dateRead instanceof Date ? book.dateRead.toISOString() : book.dateRead
    }));
    
    const recsToStore = recommendations.map(rec => ({
      ...rec,
      dateRead: rec.dateRead instanceof Date ? rec.dateRead.toISOString() : rec.dateRead
    }));
    
    // Save books using transactions with proper error handling
    await new Promise<void>((resolve, reject) => {
      try {
        const booksTx = db!.transaction([BOOKS_STORE], 'readwrite');
        const booksStore = booksTx.objectStore(BOOKS_STORE);
        
        // Clear existing data first
        const clearRequest = booksStore.clear();
        
        clearRequest.onsuccess = () => {
          console.log('Cleared existing books store');
          
          // Add all books with individual error handling
          let completed = 0;
          let failed = 0;
          
          booksToStore.forEach(book => {
            const addRequest = booksStore.put(book);
            
            addRequest.onsuccess = () => {
              completed++;
              if (completed + failed === booksToStore.length) {
                console.log(`Added ${completed}/${booksToStore.length} books to IndexedDB (${failed} failed)`);
              }
            };
            
            addRequest.onerror = (e) => {
              console.error(`Failed to add book ${book.id}:`, e);
              failed++;
              if (completed + failed === booksToStore.length) {
                console.log(`Added ${completed}/${booksToStore.length} books to IndexedDB (${failed} failed)`);
              }
            };
          });
        };
        
        clearRequest.onerror = (e) => {
          console.error('Error clearing books store:', e);
          reject(new Error('Failed to clear books store'));
        };
        
        booksTx.oncomplete = () => {
          console.log(`Books transaction completed`);
          resolve();
        };
        
        booksTx.onerror = (e) => {
          console.error('Books transaction error:', e);
          reject(new Error('Books transaction failed'));
        };
      } catch (e) {
        console.error('Exception in books transaction:', e);
        reject(e);
      }
    });
    
    // Save recommendations
    await new Promise<void>((resolve, reject) => {
      try {
        const recsTx = db!.transaction([RECOMMENDATIONS_STORE], 'readwrite');
        const recsStore = recsTx.objectStore(RECOMMENDATIONS_STORE);
        
        // Clear existing recommendations
        const clearRequest = recsStore.clear();
        
        clearRequest.onsuccess = () => {
          console.log('Cleared existing recommendations store');
          
          // Add all recommendations with individual error handling
          let completed = 0;
          let failed = 0;
          
          recsToStore.forEach(rec => {
            const addRequest = recsStore.put(rec);
            
            addRequest.onsuccess = () => {
              completed++;
              if (completed + failed === recsToStore.length) {
                console.log(`Added ${completed}/${recsToStore.length} recommendations to IndexedDB (${failed} failed)`);
              }
            };
            
            addRequest.onerror = (e) => {
              console.error(`Failed to add recommendation ${rec.id}:`, e);
              failed++;
              if (completed + failed === recsToStore.length) {
                console.log(`Added ${completed}/${recsToStore.length} recommendations to IndexedDB (${failed} failed)`);
              }
            };
          });
        };
        
        clearRequest.onerror = (e) => {
          console.error('Error clearing recommendations store:', e);
          reject(new Error('Failed to clear recommendations store'));
        };
        
        recsTx.oncomplete = () => {
          console.log(`Recommendations transaction completed`);
          resolve();
        };
        
        recsTx.onerror = (e) => {
          console.error('Recommendations transaction error:', e);
          reject(new Error('Recommendations transaction failed'));
        };
      } catch (e) {
        console.error('Exception in recommendations transaction:', e);
        reject(e);
      }
    });
    
    console.log('Successfully saved all data to IndexedDB');
    return true;
  } catch (error) {
    console.error('Failed to save to IndexedDB:', error);
    // Try fallback storage mechanisms
    try {
      saveBooksToLocalStorage(books);
      saveRecommendationsToLocalStorage(recommendations);
      console.log('Used fallback storage after IndexedDB failure');
    } catch (fallbackError) {
      console.error('All storage mechanisms failed:', fallbackError);
    }
    return false;
  } finally {
    if (db) {
      db.close();
      console.log('IndexedDB connection closed');
    }
  }
};

// Load books from IndexedDB with better error handling
const loadFromIndexedDB = async (): Promise<{ books: Book[], recommendations: Book[] }> => {
  let db: IDBDatabase | null = null;
  try {
    db = await initializeDB();
    
    // Load books with proper error handling
    const books = await new Promise<Book[]>((resolve, reject) => {
      try {
        if (!db!.objectStoreNames.contains(BOOKS_STORE)) {
          console.log(`${BOOKS_STORE} store doesn't exist yet`);
          resolve([]);
          return;
        }
        
        const tx = db!.transaction([BOOKS_STORE], 'readonly');
        const store = tx.objectStore(BOOKS_STORE);
        const request = store.getAll();
        
        request.onsuccess = () => {
          const loadedBooks = request.result || [];
          console.log(`Loaded ${loadedBooks.length} books from IndexedDB`);
          resolve(loadedBooks.map((book: any) => parseDateFields(book)));
        };
        
        request.onerror = (e) => {
          console.error('Error loading books from IndexedDB:', e);
          reject(new Error('Failed to load books from IndexedDB'));
        };
        
        tx.onerror = (e) => {
          console.error('Transaction error when loading books:', e);
          reject(new Error('Book loading transaction failed'));
        };
      } catch (error) {
        console.error('Exception during books load from IndexedDB:', error);
        reject(error);
      }
    });
    
    // Load recommendations with proper error handling
    const recommendations = await new Promise<Book[]>((resolve, reject) => {
      try {
        if (!db!.objectStoreNames.contains(RECOMMENDATIONS_STORE)) {
          console.log(`${RECOMMENDATIONS_STORE} store doesn't exist yet`);
          resolve([]);
          return;
        }
        
        const tx = db!.transaction([RECOMMENDATIONS_STORE], 'readonly');
        const store = tx.objectStore(RECOMMENDATIONS_STORE);
        const request = store.getAll();
        
        request.onsuccess = () => {
          const loadedRecs = request.result || [];
          console.log(`Loaded ${loadedRecs.length} recommendations from IndexedDB`);
          resolve(loadedRecs.map((rec: any) => parseDateFields(rec)));
        };
        
        request.onerror = (e) => {
          console.error('Error loading recommendations from IndexedDB:', e);
          reject(new Error('Failed to load recommendations from IndexedDB'));
        };
        
        tx.onerror = (e) => {
          console.error('Transaction error when loading recommendations:', e);
          reject(new Error('Recommendation loading transaction failed'));
        };
      } catch (error) {
        console.error('Exception during recommendations load from IndexedDB:', error);
        reject(error);
      }
    });
    
    return { books, recommendations };
  } catch (error) {
    console.error('Failed to load from IndexedDB:', error);
    // Return empty arrays on error, let fallback mechanisms try later
    return { books: [], recommendations: [] };
  } finally {
    if (db) {
      db.close();
      console.log('IndexedDB connection closed after loading');
    }
  }
};

// Create backup of data in localStorage and sessionStorage
const backupData = async (books: Book[], recommendations: Book[]) => {
  try {
    if (!books.length && !recommendations.length) {
      console.log('No data to backup');
      return false;
    }
    
    // Prepare data for storage - make proper JSON-safe copies
    const booksToStore = books.map(book => ({
      ...book,
      dateRead: book.dateRead instanceof Date ? book.dateRead.toISOString() : book.dateRead
    }));
    
    const recsToStore = recommendations.map(rec => ({
      ...rec,
      dateRead: rec.dateRead instanceof Date ? rec.dateRead.toISOString() : rec.dateRead
    }));
    
    try {
      // Save to localStorage
      localStorage.setItem('books_backup', JSON.stringify(booksToStore));
      localStorage.setItem('recommendations_backup', JSON.stringify(recsToStore));
      localStorage.setItem('backup_timestamp', new Date().toISOString());
      console.log(`Backup created in localStorage: ${books.length} books, ${recommendations.length} recommendations`);
    } catch (localStorageError) {
      console.error('localStorage backup failed:', localStorageError);
    }
    
    try {
      // Store a copy in sessionStorage as well for additional redundancy
      sessionStorage.setItem('books_backup', JSON.stringify(booksToStore));
      sessionStorage.setItem('recommendations_backup', JSON.stringify(recsToStore));
      console.log(`Backup created in sessionStorage: ${books.length} books, ${recommendations.length} recommendations`);
    } catch (sessionStorageError) {
      console.error('sessionStorage backup failed:', sessionStorageError);
    }
    
    return true;
  } catch (error) {
    console.error('Failed to create backup:', error);
    return false;
  }
};

// Helper function to load books from localStorage with enhanced error handling
const loadBooksFromStorage = () => {
  try {
    // Try to load books from both main and backup storage
    const locations = [
      { key: 'books', name: 'main storage' },
      { key: 'books_backup', name: 'backup storage' }
    ];
    
    for (const location of locations) {
      try {
        const savedBooks = localStorage.getItem(location.key);
        if (savedBooks) {
          // Check if the data is valid JSON
          const parsedBooks = JSON.parse(savedBooks);
          if (Array.isArray(parsedBooks) && parsedBooks.length > 0) {
            console.log(`Loaded ${parsedBooks.length} books from ${location.name}`);
            
            return parsedBooks
              .filter((book: any) => book && typeof book === 'object' && book.id && book.status !== 'recommendation')
              .map((book: any) => ({
                ...parseDateFields(book),
                // Ensure backward compatibility with older data
                id: book.id,
                title: book.title || 'Untitled Book',
                author: book.author || 'Unknown Author',
                status: book.status || 'read',
                genres: book.genres || (book.genre ? [book.genre] : []),
                progress: book.progress || (book.status === 'read' ? 100 : 0),
                pages: book.pages || 0,
                favorite: book.favorite || false,
                color: book.color || null
              }));
          }
        }
      } catch (e) {
        console.error(`Failed to load books from ${location.name}:`, e);
      }
    }
    
    // Try session storage as a last resort
    try {
      const sessionBooks = sessionStorage.getItem('books_backup');
      if (sessionBooks) {
        const parsedBooks = JSON.parse(sessionBooks);
        if (Array.isArray(parsedBooks) && parsedBooks.length > 0) {
          console.log(`Loaded ${parsedBooks.length} books from session storage backup`);
          
          return parsedBooks
            .filter((book: any) => book && typeof book === 'object' && book.id && book.status !== 'recommendation')
            .map((book: any) => ({
              ...parseDateFields(book),
              id: book.id,
              title: book.title || 'Untitled Book',
              author: book.author || 'Unknown Author',
              status: book.status || 'read',
              genres: book.genres || (book.genre ? [book.genre] : []),
              progress: book.progress || (book.status === 'read' ? 100 : 0),
              pages: book.pages || 0,
              favorite: book.favorite || false,
              color: book.color || null
            }));
        }
      }
    } catch (e) {
      console.error('Failed to load books from session storage:', e);
    }
  } catch (error) {
    console.error('Failed to parse books from all storage locations:', error);
  }
  
  console.log('No books found in any storage location');
  return [];
};

// Helper function to load recommendations from localStorage with enhanced error handling
const loadRecommendationsFromStorage = () => {
  try {
    // Try to load recommendations from both main and backup storage
    const locations = [
      { key: 'recommendations', name: 'main storage' },
      { key: 'recommendations_backup', name: 'backup storage' }
    ];
    
    for (const location of locations) {
      try {
        const savedRecs = localStorage.getItem(location.key);
        if (savedRecs) {
          // Check if the data is valid JSON
          const parsedRecs = JSON.parse(savedRecs);
          if (Array.isArray(parsedRecs) && parsedRecs.length > 0) {
            console.log(`Loaded ${parsedRecs.length} recommendations from ${location.name}`);
            
            return parsedRecs
              .filter((book: any) => book && typeof book === 'object' && book.id)
              .map((book: any) => ({
                ...parseDateFields(book),
                id: book.id,
                title: book.title || 'Untitled Recommendation',
                author: book.author || 'Unknown Author',
                progress: 0,
                pages: book.pages || 0,
                genres: book.genres || (book.genre ? [book.genre] : []),
                favorite: false,
                color: book.color || null,
                status: 'recommendation',
                recommendedBy: book.recommendedBy || 'Anonymous'
              }));
          }
        }
      } catch (e) {
        console.error(`Failed to load recommendations from ${location.name}:`, e);
      }
    }
    
    // Try session storage as a last resort
    try {
      const sessionRecs = sessionStorage.getItem('recommendations_backup');
      if (sessionRecs) {
        const parsedRecs = JSON.parse(sessionRecs);
        if (Array.isArray(parsedRecs) && parsedRecs.length > 0) {
          console.log(`Loaded ${parsedRecs.length} recommendations from session storage backup`);
          
          return parsedRecs
            .filter((book: any) => book && typeof book === 'object' && book.id)
            .map((book: any) => ({
              ...parseDateFields(book),
              id: book.id,
              title: book.title || 'Untitled Recommendation',
              author: book.author || 'Unknown Author',
              progress: 0,
              pages: book.pages || 0,
              genres: book.genres || (book.genre ? [book.genre] : []),
              favorite: false,
              color: book.color || null,
              status: 'recommendation',
              recommendedBy: book.recommendedBy || 'Anonymous'
            }));
        }
      }
    } catch (e) {
      console.error('Failed to load recommendations from session storage:', e);
    }
  } catch (error) {
    console.error('Failed to parse recommendations from all storage locations:', error);
  }
  
  console.log('No recommendations found in any storage location');
  return [];
};

// Helper function to check if backup data exists
const hasBackupData = () => {
  try {
    // Check multiple sources for backup data
    const backupTimestamp = localStorage.getItem('backup_timestamp');
    const booksBackup = localStorage.getItem('books_backup');
    const sessionBooksBackup = sessionStorage.getItem('books_backup');
    
    const hasBackup = !!(backupTimestamp && (booksBackup || sessionBooksBackup));
    console.log('Backup data check:', hasBackup ? 'Found' : 'Not found');
    return hasBackup;
  } catch (error) {
    console.error('Error checking for backup data:', error);
    return false;
  }
};

// Helper functions for localStorage
const saveBooksToLocalStorage = (booksToSave: Book[]) => {
  try {
    if (!booksToSave || booksToSave.length === 0) {
      console.log('No books to save to localStorage');
      return false;
    }
    
    const booksToStore = booksToSave.map(book => ({
      ...book,
      dateRead: book.dateRead instanceof Date ? book.dateRead.toISOString() : book.dateRead
    }));
    
    localStorage.setItem('books', JSON.stringify(booksToStore));
    console.log(`Saved ${booksToStore.length} books to localStorage`);
    return true;
  } catch (error) {
    console.error('Failed to save books to localStorage:', error);
    return false;
  }
};

const saveRecommendationsToLocalStorage = (recsToSave: Book[]) => {
  try {
    if (!recsToSave) {
      console.log('No recommendations to save to localStorage');
      return false;
    }
    
    const recsToStore = recsToSave.map(rec => ({
      ...rec,
      dateRead: rec.dateRead instanceof Date ? rec.dateRead.toISOString() : rec.dateRead
    }));
    
    localStorage.setItem('recommendations', JSON.stringify(recsToStore));
    console.log(`Saved ${recsToStore.length} recommendations to localStorage`);
    return true;
  } catch (error) {
    console.error('Failed to save recommendations to localStorage:', error);
    return false;
  }
};

export const BookshelfProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [recommendations, setRecommendations] = useState<Book[]>([]);
  const [hasBackup, setHasBackup] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [saveAttempts, setSaveAttempts] = useState<number>(0);

  // Initial load from all storage sources with retries and fallbacks
  useEffect(() => {
    const loadAllData = async () => {
      setIsLoading(true);
      console.log('Initial data load started');

      try {
        // Try to load from IndexedDB first (most reliable)
        const idbData = await loadFromIndexedDB();
        let finalBooks: Book[] = [];
        let finalRecs: Book[] = [];
        
        // Use IndexedDB data if it exists and isn't empty
        if (idbData.books && idbData.books.length > 0) {
          console.log(`Found ${idbData.books.length} books in IndexedDB`);
          finalBooks = idbData.books;
        } else {
          console.log('No books found in IndexedDB, checking localStorage');
          
          // Try localStorage if IndexedDB is empty
          const localBooks = loadBooksFromStorage();
          
          if (localBooks && localBooks.length > 0) {
            console.log(`Found ${localBooks.length} books in localStorage`);
            finalBooks = localBooks;
          } else {
            console.log('No books found in any storage');
            finalBooks = []; // Ensure we have an empty array at minimum
          }
        }
        
        // Same process for recommendations
        if (idbData.recommendations && idbData.recommendations.length > 0) {
          console.log(`Found ${idbData.recommendations.length} recommendations in IndexedDB`);
          finalRecs = idbData.recommendations;
        } else {
          console.log('No recommendations found in IndexedDB, checking localStorage');
          
          const localRecs = loadRecommendationsFromStorage();
          
          if (localRecs && localRecs.length > 0) {
            console.log(`Found ${localRecs.length} recommendations in localStorage`);
            finalRecs = localRecs;
          } else {
            console.log('No recommendations found in any storage');
            finalRecs = []; // Ensure we have an empty array at minimum
          }
        }
        
        console.log(`Setting initial state with ${finalBooks.length} books and ${finalRecs.length} recommendations`);
        
        // Set state with our loaded data
        setBooks(finalBooks);
        setRecommendations(finalRecs);
        
        // Create a backup immediately to ensure data is saved everywhere
        if (finalBooks.length > 0 || finalRecs.length > 0) {
          console.log('Creating initial backup of loaded data');
          
          // Make backups in all storage types
          backupData(finalBooks, finalRecs);
          saveBooksToLocalStorage(finalBooks);
          saveRecommendationsToLocalStorage(finalRecs);
          
          // Force an immediate save to IndexedDB as well
          await saveToIndexedDB(finalBooks, finalRecs);
          
          setHasBackup(true);
        }
        
        console.log('Initial data load completed with', finalBooks.length, 'books and', finalRecs.length, 'recommendations');
      } catch (error) {
        console.error('Error during initial data load:', error);
        toast.error('There was an error loading your books. Try reloading the page.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadAllData();
  }, []);

  // Save books to storage whenever they change - this is critical
  useEffect(() => {
    if (isLoading) return; // Don't try to save during initial load
    
    const saveAllBooks = async () => {
      console.log(`Saving ${books.length} books to all storage mechanisms`);
      
      try {
        // We'll save to both localStorage and IndexedDB for redundancy
        const localSaved = saveBooksToLocalStorage(books);
        const idbSavePromise = saveToIndexedDB(books, recommendations);
        const backupPromise = backupData(books, recommendations);
        
        // Wait for async operations to complete
        const [idbSaved, backupCreated] = await Promise.all([
          idbSavePromise,
          backupPromise
        ]);
        
        if (localSaved && idbSaved && backupCreated) {
          console.log('Successfully saved books to all storage mechanisms');
          setHasBackup(true);
          setSaveAttempts(0); // Reset save attempts on success
        } else {
          // If any save mechanism failed, we'll try again
          console.warn('Some storage mechanisms failed when saving books');
          setSaveAttempts(prev => prev + 1);
        }
      } catch (error) {
        console.error('Error during book save:', error);
        setSaveAttempts(prev => prev + 1);
      }
    };
    
    // Always save books when they change
    saveAllBooks();
  }, [books, isLoading]);

  // Save recommendations separately to avoid unnecessary saves
  useEffect(() => {
    if (isLoading || recommendations.length === 0) return;
    
    const saveAllRecs = async () => {
      console.log(`Saving ${recommendations.length} recommendations to all storage mechanisms`);
      
      try {
        // Save to all storage mechanisms
        const localSaved = saveRecommendationsToLocalStorage(recommendations);
        const idbSavePromise = saveToIndexedDB(books, recommendations);
        const backupPromise = backupData(books, recommendations);
        
        // Wait for async operations
        const [idbSaved, backupCreated] = await Promise.all([
          idbSavePromise, 
          backupPromise
        ]);
        
        if (localSaved && idbSaved && backupCreated) {
          console.log('Successfully saved recommendations to all storage mechanisms');
          setHasBackup(true);
        } else {
          console.warn('Some storage mechanisms failed when saving recommendations');
        }
      } catch (error) {
        console.error('Error during recommendations save:', error);
      }
    };
    
    saveAllRecs();
  }, [recommendations, books, isLoading]);

  // Retry failed saves
  useEffect(() => {
    if (saveAttempts > 0 && saveAttempts < 5) {
      console.log(`Retrying save (attempt ${saveAttempts})`);
      
      const retrySave = async () => {
        try {
          // Try all storage mechanisms again
          saveBooksToLocalStorage(books);
          await saveToIndexedDB(books, recommendations);
          await backupData(books, recommendations);
          
          console.log('Retry save successful');
          setSaveAttempts(0);
        } catch (error) {
          console.error('Retry save failed:', error);
        }
      };
      
      // Wait a bit longer between each retry
      const timeout = setTimeout(retrySave, 1000 * saveAttempts);
      return () => clearTimeout(timeout);
    }
  }, [saveAttempts, books, recommendations]);

  // Listen for storage events from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'books' && event.newValue) {
        try {
          const parsedBooks = JSON.parse(event.newValue);
          if (Array.isArray(parsedBooks) && parsedBooks.length > 0) {
            console.log(`Storage event: received ${parsedBooks.length} books from another tab`);
            
            // Only update if we received more books than we have
            if (parsedBooks.length > books.length) {
              setBooks(parsedBooks
                .filter((book: any) => book && typeof book === 'object' && book.id && book.status !== 'recommendation')
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
              console.log('Updated books from another tab');
            }
          }
        } catch (error) {
          console.error('Failed to parse books from storage event:', error);
        }
      }
      
      if (event.key === 'recommendations' && event.newValue) {
        try {
          const parsedRecs = JSON.parse(event.newValue);
          if (Array.isArray(parsedRecs) && parsedRecs.length > 0) {
            console.log(`Storage event: received ${parsedRecs.length} recommendations from another tab`);
            
            // Only update if we received more recommendations than we have
            if (parsedRecs.length > recommendations.length) {
              setRecommendations(parsedRecs
                .filter((rec: any) => rec && typeof rec === 'object' && rec.id)
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
              console.log('Updated recommendations from another tab');
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

  // Verify storage integrity periodically
  useEffect(() => {
    const verifyDataIntegrity = async () => {
      if (isLoading) return;
      
      try {
        console.log('Running data integrity check');
        
        // Check if IndexedDB data matches our state
        const idbData = await loadFromIndexedDB();
        const storedBooks = localStorage.getItem('books');
        const parsedStoredBooks = storedBooks ? JSON.parse(storedBooks) : [];
        
        // If we have books in state but not in storage, save them again
        if (books.length > 0 && (
            !idbData.books || 
            idbData.books.length < books.length || 
            !parsedStoredBooks || 
            parsedStoredBooks.length < books.length
          )) {
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
    
    // Verify immediately and then regularly
    verifyDataIntegrity();
    const intervalId = setInterval(verifyDataIntegrity, 15000); // Check every 15 seconds
    
    return () => clearInterval(intervalId);
  }, [books, recommendations, isLoading]);

  // Recovery function - completely rewritten for reliability
  const recoverData = async () => {
    console.log('Recovery function called');
    setIsLoading(true);
    
    try {
      // Try all possible data sources
      let recoveredBooks: Book[] = [];
      let recoveredRecs: Book[] = [];
      let sourceUsed = '';
      
      // First try IndexedDB
      try {
        console.log('Checking IndexedDB for data');
        const idbData = await loadFromIndexedDB();
        
        if (idbData.books && idbData.books.length > 0) {
          console.log(`Found ${idbData.books.length} books in IndexedDB`);
          if (idbData.books.length > recoveredBooks.length) {
            recoveredBooks = idbData.books;
            sourceUsed = 'IndexedDB';
          }
        }
        
        if (idbData.recommendations && idbData.recommendations.length > 0) {
          console.log(`Found ${idbData.recommendations.length} recommendations in IndexedDB`);
          if (idbData.recommendations.length > recoveredRecs.length) {
            recoveredRecs = idbData.recommendations;
          }
        }
      } catch (error) {
        console.error('IndexedDB recovery attempt failed:', error);
      }
      
      // Then try localStorage main storage
      try {
        console.log('Checking localStorage main storage');
        const storedBooks = localStorage.getItem('books');
        if (storedBooks) {
          const parsedBooks = JSON.parse(storedBooks);
          if (Array.isArray(parsedBooks) && parsedBooks.length > 0) {
            console.log(`Found ${parsedBooks.length} books in localStorage main storage`);
            if (parsedBooks.length > recoveredBooks.length) {
              recoveredBooks = parsedBooks.map((book: any) => parseDateFields(book));
              sourceUsed = 'localStorage main';
            }
          }
        }
        
        const storedRecs = localStorage.getItem('recommendations');
        if (storedRecs) {
          const parsedRecs = JSON.parse(storedRecs);
          if (Array.isArray(parsedRecs) && parsedRecs.length > 0) {
            console.log(`Found ${parsedRecs.length} recommendations in localStorage main storage`);
            if (parsedRecs.length > recoveredRecs.length) {
              recoveredRecs = parsedRecs.map((rec: any) => parseDateFields(rec));
            }
          }
        }
      } catch (error) {
        console.error('localStorage main recovery attempt failed:', error);
      }
      
      // Then try localStorage backup
      try {
        console.log('Checking localStorage backup');
        const backupBooks = localStorage.getItem('books_backup');
        if (backupBooks) {
          const parsedBooks = JSON.parse(backupBooks);
          if (Array.isArray(parsedBooks) && parsedBooks.length > 0) {
            console.log(`Found ${parsedBooks.length} books in localStorage backup`);
            if (parsedBooks.length > recoveredBooks.length) {
              recoveredBooks = parsedBooks.map((book: any) => parseDateFields(book));
              sourceUsed = 'localStorage backup';
            }
          }
        }
        
        const backupRecs = localStorage.getItem('recommendations_backup');
        if (backupRecs) {
          const parsedRecs = JSON.parse(backupRecs);
          if (Array.isArray(parsedRecs) && parsedRecs.length > 0) {
            console.log(`Found ${parsedRecs.length} recommendations in localStorage backup`);
            if (parsedRecs.length > recoveredRecs.length) {
              recoveredRecs = parsedRecs.map((rec: any) => parseDateFields(rec));
            }
          }
        }
      } catch (error) {
        console.error('localStorage backup recovery attempt failed:', error);
      }
      
      // Finally try sessionStorage
      try {
        console.log('Checking sessionStorage');
        const sessionBooks = sessionStorage.getItem('books_backup');
        if (sessionBooks) {
          const parsedBooks = JSON.parse(sessionBooks);
          if (Array.isArray(parsedBooks) && parsedBooks.length > 0) {
            console.log(`Found ${parsedBooks.length} books in sessionStorage`);
            if (parsedBooks.length > recoveredBooks.length) {
              recoveredBooks = parsedBooks.map((book: any) => parseDateFields(book));
              sourceUsed = 'sessionStorage';
            }
          }
        }
        
        const sessionRecs = sessionStorage.getItem('recommendations_backup');
        if (sessionRecs) {
          const parsedRecs = JSON.parse(sessionRecs);
          if (Array.isArray(parsedRecs) && parsedRecs.length > 0) {
            console.log(`Found ${parsedRecs.length} recommendations in sessionStorage`);
            if (parsedRecs.length > recoveredRecs.length) {
              recoveredRecs = parsedRecs.map((rec: any) => parseDateFields(rec));
            }
          }
        }
      } catch (error) {
        console.error('sessionStorage recovery attempt failed:', error);
      }
      
      // Now decide if we should update our state
      if (recoveredBooks.length > books.length) {
        console.log(`Recovered ${recoveredBooks.length} books from ${sourceUsed} (current: ${books.length})`);
        setBooks(recoveredBooks);
        
        // Notify user
        toast.success(`Recovered ${recoveredBooks.length} books from backup!`);
      } else if (recoveredBooks.length === books.length) {
        console.log(`Same number of books in current state and ${sourceUsed} (${books.length})`);
        toast.info(`Your books are already up to date (${books.length} books)`);
      } else {
        console.log(`Current collection has more books (${books.length}) than ${sourceUsed} (${recoveredBooks.length})`);
        toast.info(`Current collection (${books.length} books) appears more complete than backup`);
      }
      
      if (recoveredRecs.length > recommendations.length) {
        console.log(`Recovered ${recoveredRecs.length} recommendations (current: ${recommendations.length})`);
        setRecommendations(recoveredRecs);
        
        if (recoveredRecs.length > 0) {
          toast.success(`Recovered ${recoveredRecs.length} recommendations from backup!`);
        }
      }
      
      // Always create a fresh backup with the most complete data
      const bestBooks = recoveredBooks.length > books.length ? recoveredBooks : books;
      const bestRecs = recoveredRecs.length > recommendations.length ? recoveredRecs : recommendations;
      
      console.log(`Creating fresh backup with ${bestBooks.length} books and ${bestRecs.length} recommendations`);
      
      // Save to all storage mechanisms
      await saveToIndexedDB(bestBooks, bestRecs);
      saveBooksToLocalStorage(bestBooks);
      saveRecommendationsToLocalStorage(bestRecs);
      await backupData(bestBooks, bestRecs);
      
      setHasBackup(true);
    } catch (error) {
      console.error('Recovery operation failed:', error);
      toast.error('Recovery failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  // Book management functions...
  const addBook = (book: Omit<Book, 'id'>) => {
    try {
      // Generate a persistent color if not provided
      const bookColor = book.color || 
        ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'][
          Math.floor(Math.random() * 6)
        ];
      
      const newBook: Book = {
        ...book as any,
        id: uuidv4(),
        progress: book.progress || (book.status === 'read' ? 100 : 0),
        pages: book.pages || 0,
        favorite: book.favorite || false,
        genres: book.genres || [],
        color: bookColor,
        dateRead: book.dateRead || new Date()
      };
      
      console.log('Adding book:', newBook.title);
      
      if (book.status === 'recommendation') {
        setRecommendations(currentRecs => [newBook, ...currentRecs]);
        toast.success('Thank you for your recommendation!');
      } else {
        setBooks(currentBooks => [newBook, ...currentBooks]);
        toast.success('Book added to your shelf!');
      }
      
      // Force an immediate save
      setTimeout(() => {
        saveBooksToLocalStorage(book.status === 'recommendation' ? books : [...books, newBook]);
        saveRecommendationsToLocalStorage(book.status === 'recommendation' ? [...recommendations, newBook] : recommendations);
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
        setBooks(currentBooks => currentBooks.filter(book => book.id !== id));
        toast.info('Book removed from your shelf');
      } 
      // Check if it's in recommendations
      else if (recommendations.some(rec => rec.id === id)) {
        console.log('Removing recommendation:', id);
        setRecommendations(currentRecs => currentRecs.filter(rec => rec.id !== id));
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
        setBooks(currentBooks => 
          currentBooks.map(book => 
            book.id === id ? { ...book, ...bookData } : book
          )
        );
        toast.success('Book updated successfully!');
      } 
      // Then check if it's in recommendations
      else if (recommendations.some(rec => rec.id === id)) {
        console.log('Editing recommendation:', id);
        setRecommendations(currentRecs => 
          currentRecs.map(rec => 
            rec.id === id ? { ...rec, ...bookData } : rec
          )
        );
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
        setBooks(currentBooks => 
          currentBooks.map(book => 
            book.id === id ? { ...book, favorite: !book.favorite } : book
          )
        );
        toast.success('Favorite status updated!');
      } 
      // Then check if it's in recommendations
      else if (recommendations.some(rec => rec.id === id)) {
        console.log('Toggling favorite for recommendation:', id);
        setRecommendations(currentRecs => 
          currentRecs.map(rec => 
            rec.id === id ? { ...rec, favorite: !rec.favorite } : rec
          )
        );
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

