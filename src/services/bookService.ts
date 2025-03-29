
import { Book } from '@/types/book';
import { v4 as uuidv4 } from 'uuid';
import { shouldUseFallback } from '@/lib/supabase';
import * as supabaseBookService from './supabaseBookService';
import * as storageService from './storageService';

// Get all books
export const getAllBooks = async (): Promise<Book[]> => {
  // Use localStorage fallback if necessary
  if (shouldUseFallback()) {
    return storageService.getStoredBooks();
  }
  
  return supabaseBookService.getAllBooks();
};

// Get all recommendations
export const getAllRecommendations = async (): Promise<Book[]> => {
  // Use localStorage fallback if necessary
  if (shouldUseFallback()) {
    return storageService.getStoredRecommendations();
  }
  
  return supabaseBookService.getAllRecommendations();
};

// Add a book
export const addBook = async (book: Omit<Book, 'id'>): Promise<Book> => {
  // If using localStorage, generate a new book and store it
  if (shouldUseFallback()) {
    const bookWithId = {
      ...book,
      id: uuidv4(),
    } as Book;
    
    storageService.addStoredBook(bookWithId, book.status === 'recommendation');
    return bookWithId;
  }
  
  return supabaseBookService.addBook(book);
};

// Update a book
export const updateBook = async (
  id: string, 
  bookData: Partial<Book>, 
  isRecommendation: boolean = false
): Promise<Book> => {
  // If using localStorage, update the book directly
  if (shouldUseFallback()) {
    const updatedBook = storageService.updateStoredBook(id, bookData, isRecommendation);
    if (!updatedBook) {
      throw new Error(`Book with id ${id} not found`);
    }
    return updatedBook;
  }
  
  return supabaseBookService.updateBook(id, bookData, isRecommendation);
};

// Delete a book
export const deleteBook = async (id: string, isRecommendation: boolean = false): Promise<void> => {
  // If using localStorage, delete the book directly
  if (shouldUseFallback()) {
    storageService.deleteStoredBook(id, isRecommendation);
    return;
  }
  
  return supabaseBookService.deleteBook(id, isRecommendation);
};

// Update book order
export const updateBookOrder = async (orderedIds: string[]): Promise<void> => {
  // If using localStorage, update the order directly
  if (shouldUseFallback()) {
    storageService.updateStoredBookOrder(orderedIds);
    return;
  }
  
  return supabaseBookService.updateBookOrder(orderedIds);
};
