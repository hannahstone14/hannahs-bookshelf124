/**
 * Service for book-related Supabase operations
 */
import { supabase } from '@/integrations/supabase/client';
import { BOOKS_TABLE, SupabaseResponse } from '@/lib/supabase';
import { Book } from '@/types/book';
import { prepareBookForDB, convertDBToBook } from './bookMappers';
import * as storageService from './storageService';
import { withTimeout } from '@/utils/timeoutUtils';

const TIMEOUT_MS = 5000;

/**
 * Get all books from Supabase
 */
export const getAllBooks = async (): Promise<Book[]> => {
  try {
    const result = await withTimeout<SupabaseResponse<any[]>>(
      supabase.from(BOOKS_TABLE).select('*'),
      TIMEOUT_MS,
      () => ({ data: null, error: new Error('Fallback: Timed out fetching books') })
    );
    
    if (result.error) {
      console.error('Error fetching books:', result.error);
      const storedBooks = storageService.getStoredBooks();
      if (storedBooks.length > 0) {
        console.log('Using localStorage fallback for books');
        return storedBooks;
      }
      throw result.error;
    }
    
    const sortedData = (result.data || []).sort((a, b) => (a.order || 0) - (b.order || 0));
    
    return sortedData.map(convertDBToBook);
  } catch (error) {
    console.error('Error in getAllBooks:', error);
    const storedBooks = storageService.getStoredBooks();
    if (storedBooks.length > 0) {
      console.log('Using localStorage fallback for books after error');
      return storedBooks;
    }
    return [];
  }
};

/**
 * Add a book to Supabase
 */
export const addBook = async (book: Omit<Book, 'id'>): Promise<Book> => {
  const newBook = prepareBookForDB(book);
  
  try {
    console.log('Adding book to Supabase:', newBook);
    const result = await withTimeout<SupabaseResponse<any[]>>(
      supabase.from(BOOKS_TABLE).insert(newBook).select(),
      TIMEOUT_MS,
      () => ({ data: null, error: new Error('Fallback: Timed out adding book') })
    );
    
    if (result.error) {
      console.error('Error adding book to Supabase:', result.error);
      
      const bookWithId = {
        ...book,
        id: newBook.id,
      } as Book;
      
      storageService.addStoredBook(bookWithId, false);
      
      console.log('Added book to localStorage as fallback');
      return bookWithId;
    }
    
    console.log('Book added successfully to Supabase:', result.data);
    
    const bookWithId = {
      ...book,
      id: newBook.id,
    } as Book;
    
    storageService.addStoredBook(bookWithId, false);
    
    return bookWithId;
  } catch (error) {
    console.error('Error in addBook:', error);
    
    const bookWithId = {
      ...book,
      id: newBook.id,
    } as Book;
    
    storageService.addStoredBook(bookWithId, false);
    
    console.log('Added book to localStorage as fallback after error');
    return bookWithId;
  }
};

/**
 * Update a book in Supabase
 */
export const updateBook = async (
  id: string, 
  bookData: Partial<Book>
): Promise<Book> => {
  try {
    // Construct update data
    const updateData: any = {};
    
    if (bookData.title !== undefined) updateData.title = bookData.title;
    if (bookData.author !== undefined) updateData.author = bookData.author;
    if (bookData.coverUrl !== undefined) updateData.cover_url = bookData.coverUrl;
    if (bookData.status !== undefined) updateData.status = bookData.status;
    if (bookData.progress !== undefined) updateData.progress = bookData.progress;
    if (bookData.pages !== undefined) updateData.pages = bookData.pages;
    if (bookData.genres !== undefined) updateData.genres = bookData.genres;
    if (bookData.favorite !== undefined) updateData.favorite = bookData.favorite;
    if (bookData.color !== undefined) updateData.color = bookData.color;
    if (bookData.dateRead !== undefined && bookData.dateRead !== null) {
      updateData.date_read = new Date(bookData.dateRead).toISOString();
    }
    if (bookData.recommendedBy !== undefined) updateData.recommended_by = bookData.recommendedBy;
    if (bookData.order !== undefined) updateData.order = bookData.order;
    if (bookData.isSeries !== undefined) updateData.is_series = bookData.isSeries;
    if (bookData.seriesName !== undefined) updateData.series_name = bookData.seriesName;
    if (bookData.seriesPosition !== undefined) updateData.series_position = bookData.seriesPosition;
    if (bookData.tags !== undefined) updateData.tags = bookData.tags;
    
    // Perform the update operation
    const updateResult = await withTimeout<SupabaseResponse<any[]>>(
      supabase.from(BOOKS_TABLE).update(updateData).eq('id', id).select(), // Add .select() to return updated record
      TIMEOUT_MS,
      () => ({ data: null, error: new Error(`Fallback: Timed out updating book ${id}`) })
    );
    
    if (updateResult.error || !updateResult.data || updateResult.data.length === 0) {
      console.error('Error updating book in Supabase or no data returned:', updateResult.error);
      
      // Fallback to localStorage update if Supabase fails
      const updatedLocalBook = storageService.updateStoredBook(id, bookData, false);
      if (!updatedLocalBook) {
        throw new Error(`Book with id ${id} not found in localStorage either after Supabase error`);
      }
      console.log('Updated book in localStorage as fallback after Supabase error.');
      return updatedLocalBook;
    }
    
    // Successfully updated in Supabase, convert the returned record
    const updatedBookFromDB = convertDBToBook(updateResult.data[0]);
    
    // Also update localStorage for consistency and offline fallback
    storageService.updateStoredBook(id, updatedBookFromDB, false);
    
    return updatedBookFromDB;

  } catch (error) {
    console.error('Error in updateBook:', error);
    
    // Fallback to localStorage update on general error
    const updatedBook = storageService.updateStoredBook(id, bookData, false);
    
    if (!updatedBook) {
      console.error(`Book with id ${id} not found in localStorage during error recovery`);
      throw error; // Re-throw the original error if localStorage update also fails
    }
    
    console.log('Updated book in localStorage as fallback after general error');
    return updatedBook;
  }
};

/**
 * Delete a book from Supabase
 */
export const deleteBook = async (id: string): Promise<void> => {
  try {
    const result = await withTimeout<SupabaseResponse<any>>(
      supabase.from(BOOKS_TABLE).delete().eq('id', id),
      TIMEOUT_MS,
      () => ({ data: null, error: new Error(`Fallback: Timed out deleting book ${id}`) })
    );
    
    if (result.error) {
      console.error('Error deleting book from Supabase:', result.error);
    }
    
    storageService.deleteStoredBook(id, false);
  } catch (error) {
    console.error('Error in deleteBook:', error);
    
    storageService.deleteStoredBook(id, false);
  }
};

/**
 * Update the order of books in Supabase
 */
export const updateBookOrder = async (orderedIds: string[]): Promise<void> => {
  try {
    const updatePromises = orderedIds.map((id, index) => {
      return withTimeout<SupabaseResponse<any>>(
        supabase.from(BOOKS_TABLE).update({ order: index }).eq('id', id),
        TIMEOUT_MS,
        () => ({ data: null, error: new Error(`Fallback: Timed out updating order for book ${id}`) })
      );
    });
    
    await Promise.all(updatePromises);
    
    storageService.updateStoredBookOrder(orderedIds);
  } catch (error) {
    console.error('Error in updateBookOrder:', error);
    
    storageService.updateStoredBookOrder(orderedIds);
  }
};

/**
 * Get all books in a series from Supabase
 */
export const getBooksInSeries = async (seriesName: string): Promise<Book[]> => {
  try {
    const result = await withTimeout<SupabaseResponse<any[]>>(
      supabase.from(BOOKS_TABLE).select('*').eq('series_name', seriesName).order('series_position', { ascending: true }),
      TIMEOUT_MS,
      () => ({ data: null, error: new Error(`Fallback: Timed out fetching series books for ${seriesName}`) })
    );
    
    if (result.error) {
      console.error('Error fetching series books from Supabase:', result.error);
      
      const allBooks = storageService.getStoredBooks();
      const localSeriesBooks = allBooks.filter(book => book.seriesName === seriesName)
        .sort((a, b) => (a.seriesPosition || 0) - (b.seriesPosition || 0));
      
      if (localSeriesBooks.length > 0) {
        console.log('Using localStorage fallback for series books');
        return localSeriesBooks;
      }
      
      throw result.error;
    }
    
    return (result.data || []).map(convertDBToBook);
  } catch (error) {
    console.error('Error in getBooksInSeries:', error);
    
    const allBooks = storageService.getStoredBooks();
    const localSeriesBooks = allBooks.filter(book => book.seriesName === seriesName)
      .sort((a, b) => (a.seriesPosition || 0) - (b.seriesPosition || 0));
    
    return localSeriesBooks;
  }
};
