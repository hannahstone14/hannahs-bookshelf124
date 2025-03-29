
/**
 * Service for recommendation-related Supabase operations
 */
import { supabase } from '@/integrations/supabase/client';
import { RECOMMENDATIONS_TABLE, SupabaseResponse } from '@/lib/supabase';
import { Book } from '@/types/book';
import { prepareBookForDB, convertDBToBook } from './bookMappers';
import * as storageService from './storageService';
import { withTimeout } from '@/utils/timeoutUtils';

const TIMEOUT_MS = 5000;

/**
 * Get all recommendations from Supabase
 */
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

/**
 * Add a recommendation to Supabase
 */
export const addRecommendation = async (book: Omit<Book, 'id'>): Promise<Book> => {
  const newBook = prepareBookForDB(book);
  
  try {
    console.log('Adding recommendation to Supabase:', newBook);
    const result = await withTimeout<SupabaseResponse<any[]>>(
      supabase.from(RECOMMENDATIONS_TABLE).insert(newBook).select(),
      TIMEOUT_MS,
      () => ({ data: null, error: new Error('Fallback: Timed out adding recommendation') })
    );
    
    if (result.error) {
      console.error('Error adding recommendation to Supabase:', result.error);
      
      const bookWithId = {
        ...book,
        id: newBook.id,
      } as Book;
      
      storageService.addStoredBook(bookWithId, true);
      
      console.log('Added recommendation to localStorage as fallback');
      return bookWithId;
    }
    
    console.log('Recommendation added successfully to Supabase:', result.data);
    
    const bookWithId = {
      ...book,
      id: newBook.id,
    } as Book;
    
    storageService.addStoredBook(bookWithId, true);
    
    return bookWithId;
  } catch (error) {
    console.error('Error in addRecommendation:', error);
    
    const bookWithId = {
      ...book,
      id: newBook.id,
    } as Book;
    
    storageService.addStoredBook(bookWithId, true);
    
    console.log('Added recommendation to localStorage as fallback after error');
    return bookWithId;
  }
};

/**
 * Update a recommendation in Supabase
 */
export const updateRecommendation = async (
  id: string, 
  bookData: Partial<Book>
): Promise<Book> => {
  try {
    const existingBookResult = await withTimeout<SupabaseResponse<any>>(
      supabase.from(RECOMMENDATIONS_TABLE).select('*').eq('id', id).single(),
      TIMEOUT_MS,
      () => ({ data: null, error: new Error(`Fallback: Timed out fetching recommendation ${id}`) })
    );
    
    const existingBook = existingBookResult.data;
    const checkError = existingBookResult.error;
    
    if (checkError || !existingBook) {
      console.warn(`Recommendation with id ${id} not found in Supabase ${RECOMMENDATIONS_TABLE}, checking localStorage`);
      
      const collection = storageService.getStoredRecommendations();
      
      const localBook = collection.find(b => b.id === id);
      
      if (!localBook) {
        throw new Error(`Recommendation with id ${id} not found in ${RECOMMENDATIONS_TABLE} or localStorage`);
      }
      
      const updatedBook = { ...localBook, ...bookData };
      storageService.updateStoredBook(id, bookData, true);
      
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
    if (bookData.isSeries !== undefined) updateData.is_series = bookData.isSeries;
    if (bookData.seriesName !== undefined) updateData.series_name = bookData.seriesName;
    if (bookData.seriesPosition !== undefined) updateData.series_position = bookData.seriesPosition;
    if (bookData.tags !== undefined) updateData.tags = bookData.tags;
    
    const updateResult = await withTimeout<SupabaseResponse<any>>(
      supabase.from(RECOMMENDATIONS_TABLE).update(updateData).eq('id', id),
      TIMEOUT_MS,
      () => ({ data: null, error: new Error(`Fallback: Timed out updating recommendation ${id}`) })
    );
    
    if (updateResult.error) {
      console.error('Error updating recommendation in Supabase:', updateResult.error);
      
      storageService.updateStoredBook(id, bookData, true);
      
      console.log('Updated recommendation in localStorage as fallback');
    } else {
      storageService.updateStoredBook(id, bookData, true);
    }
    
    return {
      ...convertDBToBook(existingBook),
      ...bookData,
      id
    } as Book;
  } catch (error) {
    console.error('Error in updateRecommendation:', error);
    
    const updatedBook = storageService.updateStoredBook(id, bookData, true);
    
    if (!updatedBook) {
      throw error;
    }
    
    console.log('Updated recommendation in localStorage as fallback after error');
    return updatedBook;
  }
};

/**
 * Delete a recommendation from Supabase
 */
export const deleteRecommendation = async (id: string): Promise<void> => {
  try {
    const result = await withTimeout<SupabaseResponse<any>>(
      supabase.from(RECOMMENDATIONS_TABLE).delete().eq('id', id),
      TIMEOUT_MS,
      () => ({ data: null, error: new Error(`Fallback: Timed out deleting recommendation ${id}`) })
    );
    
    if (result.error) {
      console.error('Error deleting recommendation from Supabase:', result.error);
    }
    
    storageService.deleteStoredBook(id, true);
  } catch (error) {
    console.error('Error in deleteRecommendation:', error);
    
    storageService.deleteStoredBook(id, true);
  }
};
