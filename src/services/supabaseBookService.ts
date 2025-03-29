
/**
 * Main service that delegates to the specific book/recommendation services
 */
import { Book } from '@/types/book';
import * as booksService from './booksSupabaseService';
import * as recommendationsService from './recommendationsSupabaseService';

export const getAllBooks = booksService.getAllBooks;
export const getBooksInSeries = booksService.getBooksInSeries;
export const updateBookOrder = booksService.updateBookOrder;
export const getAllRecommendations = recommendationsService.getAllRecommendations;

/**
 * Add a book to the appropriate service based on its status
 */
export const addBook = async (book: Omit<Book, 'id'>): Promise<Book> => {
  if (book.status === 'recommendation') {
    return recommendationsService.addRecommendation(book);
  }
  return booksService.addBook(book);
};

/**
 * Update a book in the appropriate service
 */
export const updateBook = async (
  id: string, 
  bookData: Partial<Book>, 
  isRecommendation: boolean = false
): Promise<Book> => {
  if (isRecommendation) {
    return recommendationsService.updateRecommendation(id, bookData);
  }
  return booksService.updateBook(id, bookData);
};

/**
 * Delete a book from the appropriate service
 */
export const deleteBook = async (id: string, isRecommendation: boolean = false): Promise<void> => {
  if (isRecommendation) {
    return recommendationsService.deleteRecommendation(id);
  }
  return booksService.deleteBook(id);
};
