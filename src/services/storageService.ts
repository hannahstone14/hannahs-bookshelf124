
import { Book } from '@/types/book';

// LocalStorage service for handling book data when not using Supabase
export const getStoredBooks = (): Book[] => {
  try {
    const storedBooks = localStorage.getItem('books');
    return storedBooks ? JSON.parse(storedBooks) : [];
  } catch (error) {
    console.error('Error getting books from localStorage:', error);
    return [];
  }
};

export const getStoredRecommendations = (): Book[] => {
  try {
    const storedRecommendations = localStorage.getItem('recommendations');
    return storedRecommendations ? JSON.parse(storedRecommendations) : [];
  } catch (error) {
    console.error('Error getting recommendations from localStorage:', error);
    return [];
  }
};

export const storeBooks = (books: Book[]): void => {
  try {
    localStorage.setItem('books', JSON.stringify(books));
  } catch (error) {
    console.error('Error saving books to localStorage:', error);
  }
};

export const storeRecommendations = (recommendations: Book[]): void => {
  try {
    localStorage.setItem('recommendations', JSON.stringify(recommendations));
  } catch (error) {
    console.error('Error saving recommendations to localStorage:', error);
  }
};

export const addStoredBook = (book: Book, isRecommendation: boolean = false): void => {
  try {
    const storageKey = isRecommendation ? 'recommendations' : 'books';
    const existing = localStorage.getItem(storageKey);
    const items = existing ? JSON.parse(existing) : [];
    localStorage.setItem(storageKey, JSON.stringify([...items, book]));
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
    
    const updatedBook = { ...items[itemIndex], ...bookData };
    items[itemIndex] = updatedBook;
    
    localStorage.setItem(storageKey, JSON.stringify(items));
    
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
    
    localStorage.setItem(storageKey, JSON.stringify(updatedItems));
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
    
    localStorage.setItem('books', JSON.stringify([...orderedBooks, ...unorderedBooks]));
  } catch (error) {
    console.error('Error updating book order in localStorage:', error);
  }
};
