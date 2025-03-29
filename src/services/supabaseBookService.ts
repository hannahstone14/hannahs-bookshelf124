
import { supabase } from '@/integrations/supabase/client';
import { BOOKS_TABLE, RECOMMENDATIONS_TABLE, SupabaseResponse } from '@/lib/supabase';
import { Book } from '@/types/book';
import { prepareBookForDB, convertDBToBook } from './bookMappers';
import * as storageService from './storageService';

const TIMEOUT_MS = 5000;

// Updated withTimeout function with proper typing for Supabase queries
const withTimeout = async <T>(
  promise: Promise<T> | { then(onfulfilled: any): any },
  timeoutMs: number,
  fallbackFn?: () => SupabaseResponse<any>
): Promise<T> => {
  let timeoutId: NodeJS.Timeout;
  
  // Convert the input to a proper Promise if it's not already one
  const actualPromise = Promise.resolve(promise);
  
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Request timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });
  
  try {
    const result = await Promise.race([
      actualPromise,
      timeoutPromise
    ]);
    
    clearTimeout(timeoutId);
    return result as T;
  } catch (error) {
    clearTimeout(timeoutId);
    if (fallbackFn) {
      console.warn('Using fallback function due to error:', error);
      return fallbackFn() as T;
    }
    throw error;
  }
};

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

export const getAllRecommendations = async (): Promise<Book[]> => {
  try {
    const result = await withTimeout<SupabaseResponse<any[]>>(
      supabase.from(RECOMMENDATIONS_TABLE).select('*'),
      TIMEOUT_MS,
      () => ({ data: null, error: new Error('Fallback: Timed out fetching recommendations') })
    );
    
    if (result.error) {
      console.error('Error fetching recommendations:', result.error);
      const storedRecommendations = storageService.getStoredRecommendations();
      if (storedRecommendations.length > 0) {
        console.log('Using localStorage fallback for recommendations');
        return storedRecommendations;
      }
      throw result.error;
    }
    
    const sortedData = (result.data || []).sort((a, b) => 
      new Date(b.date_read).getTime() - new Date(a.date_read).getTime()
    );
    
    return sortedData.map(convertDBToBook);
  } catch (error) {
    console.error('Error in getAllRecommendations:', error);
    const storedRecommendations = storageService.getStoredRecommendations();
    if (storedRecommendations.length > 0) {
      console.log('Using localStorage fallback for recommendations after error');
      return storedRecommendations;
    }
    return [];
  }
};

export const addBook = async (book: Omit<Book, 'id'>): Promise<Book> => {
  const newBook = prepareBookForDB(book);
  const tableName = book.status === 'recommendation' ? RECOMMENDATIONS_TABLE : BOOKS_TABLE;
  
  try {
    console.log('Adding book to Supabase:', newBook);
    const result = await withTimeout<SupabaseResponse<any[]>>(
      supabase.from(tableName).insert(newBook).select(),
      TIMEOUT_MS,
      () => ({ data: null, error: new Error('Fallback: Timed out adding book') })
    );
    
    if (result.error) {
      console.error('Error adding book to Supabase:', result.error);
      
      const bookWithId = {
        ...book,
        id: newBook.id,
      } as Book;
      
      storageService.addStoredBook(bookWithId, book.status === 'recommendation');
      
      console.log('Added book to localStorage as fallback');
      return bookWithId;
    }
    
    console.log('Book added successfully to Supabase:', result.data);
    
    const bookWithId = {
      ...book,
      id: newBook.id,
    } as Book;
    
    storageService.addStoredBook(bookWithId, book.status === 'recommendation');
    
    return bookWithId;
  } catch (error) {
    console.error('Error in addBook:', error);
    
    const bookWithId = {
      ...book,
      id: newBook.id,
    } as Book;
    
    storageService.addStoredBook(bookWithId, book.status === 'recommendation');
    
    console.log('Added book to localStorage as fallback after error');
    return bookWithId;
  }
};

export const updateBook = async (
  id: string, 
  bookData: Partial<Book>, 
  isRecommendation: boolean = false
): Promise<Book> => {
  const tableName = isRecommendation ? RECOMMENDATIONS_TABLE : BOOKS_TABLE;
  
  try {
    const existingBookResult = await withTimeout<SupabaseResponse<any>>(
      supabase.from(tableName).select('*').eq('id', id).single(),
      TIMEOUT_MS,
      () => ({ data: null, error: new Error(`Fallback: Timed out fetching book ${id}`) })
    );
    
    const existingBook = existingBookResult.data;
    const checkError = existingBookResult.error;
    
    if (checkError || !existingBook) {
      console.warn(`Book with id ${id} not found in Supabase ${tableName}, checking localStorage`);
      
      const collection = isRecommendation ? 
        storageService.getStoredRecommendations() : 
        storageService.getStoredBooks();
      
      const localBook = collection.find(b => b.id === id);
      
      if (!localBook) {
        throw new Error(`Book with id ${id} not found in ${tableName} or localStorage`);
      }
      
      const updatedBook = { ...localBook, ...bookData };
      storageService.updateStoredBook(id, bookData, isRecommendation);
      
      return updatedBook;
    }
    
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
    if (bookData.dateRead !== undefined) updateData.date_read = new Date(bookData.dateRead).toISOString();
    if (bookData.recommendedBy !== undefined) updateData.recommended_by = bookData.recommendedBy;
    if (bookData.order !== undefined) updateData.order = bookData.order;
    if (bookData.isSeries !== undefined) updateData.is_series = bookData.isSeries;
    if (bookData.seriesName !== undefined) updateData.series_name = bookData.seriesName;
    if (bookData.seriesPosition !== undefined) updateData.series_position = bookData.seriesPosition;
    if (bookData.tags !== undefined) updateData.tags = bookData.tags;
    
    const updateResult = await withTimeout<SupabaseResponse<any>>(
      supabase.from(tableName).update(updateData).eq('id', id),
      TIMEOUT_MS,
      () => ({ data: null, error: new Error(`Fallback: Timed out updating book ${id}`) })
    );
    
    if (updateResult.error) {
      console.error('Error updating book in Supabase:', updateResult.error);
      
      storageService.updateStoredBook(id, bookData, isRecommendation);
      
      console.log('Updated book in localStorage as fallback');
    } else {
      storageService.updateStoredBook(id, bookData, isRecommendation);
    }
    
    return {
      ...convertDBToBook(existingBook),
      ...bookData,
      id
    } as Book;
  } catch (error) {
    console.error('Error in updateBook:', error);
    
    const updatedBook = storageService.updateStoredBook(id, bookData, isRecommendation);
    
    if (!updatedBook) {
      throw error;
    }
    
    console.log('Updated book in localStorage as fallback after error');
    return updatedBook;
  }
};

export const deleteBook = async (id: string, isRecommendation: boolean = false): Promise<void> => {
  try {
    const result = await withTimeout<SupabaseResponse<any>>(
      supabase.from(isRecommendation ? RECOMMENDATIONS_TABLE : BOOKS_TABLE).delete().eq('id', id),
      TIMEOUT_MS,
      () => ({ data: null, error: new Error(`Fallback: Timed out deleting book ${id}`) })
    );
    
    if (result.error) {
      console.error('Error deleting book from Supabase:', result.error);
    }
    
    storageService.deleteStoredBook(id, isRecommendation);
  } catch (error) {
    console.error('Error in deleteBook:', error);
    
    storageService.deleteStoredBook(id, isRecommendation);
  }
};

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
