
import { Book } from '@/types/book';

// LocalStorage service for handling book data when not using Supabase
export const getStoredBooks = (): Book[] => {
  try {
    const storedBooks = localStorage.getItem('books');
    if (!storedBooks) {
      console.log('No books found in localStorage, returning empty array');
      return [];
    }
    const parsedBooks = JSON.parse(storedBooks);
    
    // Filter out test books to ensure they don't reappear
    const filteredBooks = parsedBooks.filter((book: Book) => {
      return !book.title.includes('Sample Book') && 
             book.title !== 'hk' && 
             book.title !== 'ver';
    });
    
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
    const parsedRecommendations = JSON.parse(storedRecommendations);
    
    // Filter out test recommendations
    const filteredRecommendations = parsedRecommendations.filter((book: Book) => {
      return !book.title.includes('Sample Book') && 
             book.title !== 'hk' && 
             book.title !== 'ver';
    });
    
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
    const filteredBooks = books.filter(book => {
      return !book.title.includes('Sample Book') && 
             book.title !== 'hk' && 
             book.title !== 'ver';
    });
    
    localStorage.setItem('books', JSON.stringify(filteredBooks));
    console.log(`Stored ${filteredBooks.length} books in localStorage`);
  } catch (error) {
    console.error('Error saving books to localStorage:', error);
  }
};

export const storeRecommendations = (recommendations: Book[]): void => {
  try {
    // Filter out test recommendations before storing
    const filteredRecommendations = recommendations.filter(book => {
      return !book.title.includes('Sample Book') && 
             book.title !== 'hk' && 
             book.title !== 'ver';
    });
    
    localStorage.setItem('recommendations', JSON.stringify(filteredRecommendations));
    console.log(`Stored ${filteredRecommendations.length} recommendations in localStorage`);
  } catch (error) {
    console.error('Error saving recommendations to localStorage:', error);
  }
};

export const addStoredBook = (book: Book, isRecommendation: boolean = false): void => {
  try {
    // Don't add test books
    if (book.title.includes('Sample Book') || book.title === 'hk' || book.title === 'ver') {
      console.log(`Prevented adding test book "${book.title}" to localStorage`);
      return;
    }
    
    const storageKey = isRecommendation ? 'recommendations' : 'books';
    const existing = localStorage.getItem(storageKey);
    const items = existing ? JSON.parse(existing) : [];
    
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
    
    const items = JSON.parse(existing);
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
    items[itemIndex] = updatedBook;
    
    // Filter out test books before storing
    const filteredItems = items.filter((book: Book) => {
      return !book.title.includes('Sample Book') && 
             book.title !== 'hk' && 
             book.title !== 'ver';
    });
    
    localStorage.setItem(storageKey, JSON.stringify(filteredItems));
    console.log(`Updated book "${updatedBook.title}" in localStorage. Total items: ${filteredItems.length}`);
    
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
    
    const items = JSON.parse(existing);
    const updatedItems = items.filter((item: Book) => item.id !== id);
    
    // Extra filter to ensure test books don't persist
    const cleanedItems = updatedItems.filter((book: Book) => {
      return !book.title.includes('Sample Book') && 
             book.title !== 'hk' && 
             book.title !== 'ver';
    });
    
    localStorage.setItem(storageKey, JSON.stringify(cleanedItems));
    console.log(`Deleted book with ID ${id} from localStorage. Remaining count: ${cleanedItems.length}`);
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
    
    const books = JSON.parse(existing);
    
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
    
    // Filter out test books
    const filteredBooks = [...orderedBooks, ...unorderedBooks].filter(book => {
      return !book.title.includes('Sample Book') && 
             book.title !== 'hk' && 
             book.title !== 'ver';
    });
    
    localStorage.setItem('books', JSON.stringify(filteredBooks));
    console.log(`Updated book order in localStorage. Total books: ${filteredBooks.length}`);
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
      const books = JSON.parse(storedBooks);
      const cleanedBooks = books.filter((book: Book) => {
        return !book.title.includes('Sample Book') && 
               book.title !== 'hk' && 
               book.title !== 'ver';
      });
      localStorage.setItem('books', JSON.stringify(cleanedBooks));
      console.log(`Cleaned up books storage. Removed ${books.length - cleanedBooks.length} test books.`);
    }
    
    // Clean recommendations
    const storedRecs = localStorage.getItem('recommendations');
    if (storedRecs) {
      const recs = JSON.parse(storedRecs);
      const cleanedRecs = recs.filter((book: Book) => {
        return !book.title.includes('Sample Book') && 
               book.title !== 'hk' && 
               book.title !== 'ver';
      });
      localStorage.setItem('recommendations', JSON.stringify(cleanedRecs));
      console.log(`Cleaned up recommendations storage. Removed ${recs.length - cleanedRecs.length} test recommendations.`);
    }
  } catch (error) {
    console.error('Error cleaning up storage:', error);
  }
};

// Run cleanup immediately
cleanupStorage();
