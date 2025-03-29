
import { Book } from '@/types/book';
import { TEST_BOOK_PATTERNS, isTestBook } from '@/lib/supabase';

// LocalStorage service for handling book data when not using Supabase
export const getStoredBooks = (): Book[] => {
  try {
    const storedBooks = localStorage.getItem('books');
    if (!storedBooks) {
      console.log('No books found in localStorage, returning empty array');
      return [];
    }
    
    let parsedBooks: Book[] = [];
    try {
      parsedBooks = JSON.parse(storedBooks);
    } catch (e) {
      console.error('Failed to parse books from localStorage:', e);
      // Reset books in localStorage to prevent future parsing errors
      localStorage.setItem('books', JSON.stringify([]));
      return [];
    }
    
    // Filter out test books using consistent function
    const filteredBooks = parsedBooks.filter(book => !isTestBook(book));
    
    console.log(`Retrieved ${filteredBooks.length} books from localStorage (filtered from ${parsedBooks.length})`);
    return filteredBooks;
  } catch (error) {
    console.error('Error getting books from localStorage:', error);
    return [];
  }
};

export const getStoredRecommendations = (): Book[] => {
  try {
    const storedRecommendations = localStorage.getItem('recommendations');
    if (!storedRecommendations) {
      console.log('No recommendations found in localStorage, returning empty array');
      return [];
    }
    
    let parsedRecommendations: Book[] = [];
    try {
      parsedRecommendations = JSON.parse(storedRecommendations);
    } catch (e) {
      console.error('Failed to parse recommendations from localStorage:', e);
      // Reset recommendations in localStorage to prevent future parsing errors
      localStorage.setItem('recommendations', JSON.stringify([]));
      return [];
    }
    
    // Filter out test recommendations using consistent function
    const filteredRecommendations = parsedRecommendations.filter(book => !isTestBook(book));
    
    console.log(`Retrieved ${filteredRecommendations.length} recommendations from localStorage (filtered from ${parsedRecommendations.length})`);
    return filteredRecommendations;
  } catch (error) {
    console.error('Error getting recommendations from localStorage:', error);
    return [];
  }
};

export const storeBooks = (books: Book[]): void => {
  try {
    // Filter out test books before storing
    const filteredBooks = books.filter(book => !isTestBook(book));
    
    localStorage.setItem('books', JSON.stringify(filteredBooks));
    console.log(`Stored ${filteredBooks.length} books in localStorage`);
  } catch (error) {
    console.error('Error saving books to localStorage:', error);
  }
};

export const storeRecommendations = (recommendations: Book[]): void => {
  try {
    // Filter out test recommendations before storing
    const filteredRecommendations = recommendations.filter(book => !isTestBook(book));
    
    localStorage.setItem('recommendations', JSON.stringify(filteredRecommendations));
    console.log(`Stored ${filteredRecommendations.length} recommendations in localStorage`);
  } catch (error) {
    console.error('Error saving recommendations to localStorage:', error);
  }
};

export const addStoredBook = (book: Book, isRecommendation: boolean = false): void => {
  try {
    // Don't add test books
    if (isTestBook(book)) {
      console.log(`Prevented adding test book "${book.title}" to localStorage`);
      return;
    }
    
    const storageKey = isRecommendation ? 'recommendations' : 'books';
    const existing = localStorage.getItem(storageKey);
    let items: Book[] = [];
    
    if (existing) {
      try {
        items = JSON.parse(existing);
      } catch (e) {
        console.error(`Failed to parse ${storageKey} from localStorage:`, e);
        items = [];
      }
    }
    
    // Filter existing items to remove any test books that might have slipped in
    items = items.filter(item => !isTestBook(item));
    
    // Check if book already exists
    const existingIndex = items.findIndex((item: Book) => item.id === book.id);
    if (existingIndex >= 0) {
      items[existingIndex] = book; // Update existing book
    } else {
      items.push(book); // Add new book
    }
    
    localStorage.setItem(storageKey, JSON.stringify(items));
    console.log(`Added/updated book "${book.title}" to ${storageKey}. New count: ${items.length}`);
  } catch (error) {
    console.error(`Error adding book to ${isRecommendation ? 'recommendations' : 'books'} in localStorage:`, error);
  }
};

export const updateStoredBook = (
  id: string, 
  bookData: Partial<Book>, 
  isRecommendation: boolean = false
): Book | null => {
  try {
    const storageKey = isRecommendation ? 'recommendations' : 'books';
    const existing = localStorage.getItem(storageKey);
    
    if (!existing) {
      return null;
    }
    
    let items: Book[] = [];
    try {
      items = JSON.parse(existing);
    } catch (e) {
      console.error(`Failed to parse ${storageKey} from localStorage:`, e);
      return null;
    }
    
    // Filter out test books first
    items = items.filter(item => !isTestBook(item));
    
    const itemIndex = items.findIndex((item: Book) => item.id === id);
    
    if (itemIndex === -1) {
      return null;
    }
    
    // Handle series data
    if (bookData.isSeries && !bookData.totalSeriesBooks && items[itemIndex].totalSeriesBooks) {
      bookData.totalSeriesBooks = items[itemIndex].totalSeriesBooks;
    }
    
    if (bookData.isSeries && !bookData.totalSeriesPages && items[itemIndex].totalSeriesPages) {
      bookData.totalSeriesPages = items[itemIndex].totalSeriesPages;
    }
    
    const updatedBook = { ...items[itemIndex], ...bookData };
    
    // Ensure updated book is not a test book
    if (isTestBook(updatedBook)) {
      console.log(`Prevented updating to test book "${updatedBook.title}" in localStorage`);
      return items[itemIndex];
    }
    
    items[itemIndex] = updatedBook;
    
    localStorage.setItem(storageKey, JSON.stringify(items));
    console.log(`Updated book "${updatedBook.title}" in localStorage. Total items: ${items.length}`);
    
    return updatedBook;
  } catch (error) {
    console.error('Error updating book in localStorage:', error);
    return null;
  }
};

export const deleteStoredBook = (id: string, isRecommendation: boolean = false): void => {
  try {
    const storageKey = isRecommendation ? 'recommendations' : 'books';
    const existing = localStorage.getItem(storageKey);
    
    if (!existing) {
      return;
    }
    
    let items: Book[] = [];
    try {
      items = JSON.parse(existing);
    } catch (e) {
      console.error(`Failed to parse ${storageKey} from localStorage:`, e);
      localStorage.setItem(storageKey, JSON.stringify([]));
      return;
    }
    
    // Filter out the book to delete and any test books
    const updatedItems = items.filter((item: Book) => {
      return item.id !== id && !isTestBook(item);
    });
    
    localStorage.setItem(storageKey, JSON.stringify(updatedItems));
    console.log(`Deleted book with ID ${id} from localStorage. Remaining count: ${updatedItems.length}`);
  } catch (error) {
    console.error('Error deleting book from localStorage:', error);
  }
};

export const updateStoredBookOrder = (orderedIds: string[]): void => {
  try {
    const existing = localStorage.getItem('books');
    
    if (!existing) {
      return;
    }
    
    let books: Book[] = [];
    try {
      books = JSON.parse(existing);
    } catch (e) {
      console.error('Failed to parse books from localStorage:', e);
      return;
    }
    
    // Filter out test books first
    books = books.filter(book => !isTestBook(book));
    
    // Create a map of id to books
    const bookMap = books.reduce((map: Record<string, Book>, book: Book) => {
      map[book.id] = book;
      return map;
    }, {});
    
    // Reorder books based on orderedIds
    const orderedBooks = orderedIds
      .filter(id => bookMap[id]) // Only include existing books
      .map((id, index) => ({
        ...bookMap[id],
        order: index
      }));
    
    // Add any books that weren't in the ordered list
    const unorderedBooks = books.filter((book: Book) => !orderedIds.includes(book.id));
    
    localStorage.setItem('books', JSON.stringify([...orderedBooks, ...unorderedBooks]));
    console.log(`Updated book order in localStorage. Total books: ${orderedBooks.length + unorderedBooks.length}`);
  } catch (error) {
    console.error('Error updating book order in localStorage:', error);
  }
};

// Add function to clean up storage from test books
export const cleanupStorage = (): void => {
  try {
    // Clean books
    const storedBooks = localStorage.getItem('books');
    if (storedBooks) {
      let books: Book[] = [];
      try {
        books = JSON.parse(storedBooks);
      } catch (e) {
        console.error('Failed to parse books from localStorage:', e);
        localStorage.setItem('books', JSON.stringify([]));
        console.log('Reset books storage due to parsing error.');
        return;
      }
      
      const cleanedBooks = books.filter((book: Book) => !isTestBook(book));
      localStorage.setItem('books', JSON.stringify(cleanedBooks));
      console.log(`Cleaned up books storage. Removed ${books.length - cleanedBooks.length} test books.`);
    }
    
    // Clean recommendations
    const storedRecs = localStorage.getItem('recommendations');
    if (storedRecs) {
      let recs: Book[] = [];
      try {
        recs = JSON.parse(storedRecs);
      } catch (e) {
        console.error('Failed to parse recommendations from localStorage:', e);
        localStorage.setItem('recommendations', JSON.stringify([]));
        console.log('Reset recommendations storage due to parsing error.');
        return;
      }
      
      const cleanedRecs = recs.filter((book: Book) => !isTestBook(book));
      localStorage.setItem('recommendations', JSON.stringify(cleanedRecs));
      console.log(`Cleaned up recommendations storage. Removed ${recs.length - cleanedRecs.length} test recommendations.`);
    }
  } catch (error) {
    console.error('Error cleaning up storage:', error);
  }
};

// Run cleanup immediately and automatically on every file load
cleanupStorage();

// Force another cleanup
setTimeout(cleanupStorage, 1000);

// Export a function to thoroughly purge test books
export const purgeTestBooks = (): void => {
  // Run multiple times to ensure everything is cleaned
  cleanupStorage();
  cleanupStorage();
  
  // Add an extra specialized cleanup
  try {
    // Additional thorough cleanup for books
    const books = getStoredBooks();
    storeBooks(books);
    
    // Additional thorough cleanup for recommendations
    const recommendations = getStoredRecommendations();
    storeRecommendations(recommendations);
    
    console.log('Completed thorough purge of test books');
  } catch (error) {
    console.error('Error during thorough purge:', error);
  }
};
