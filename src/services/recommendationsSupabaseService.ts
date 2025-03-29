
import { supabase } from '@/integrations/supabase/client';
import { Book } from '@/types/book';
import { RECOMMENDATIONS_TABLE, SupabaseResponse, shouldUseFallback } from '@/lib/supabase';
import { withTimeout } from '@/utils/timeoutUtils';
import * as storageService from './storageService';

/**
 * Map database recommendation to application book
 */
const mapDbRecommendationToBook = (dbRecommendation: any): Book => {
  return {
    id: dbRecommendation.id,
    title: dbRecommendation.title,
    author: dbRecommendation.author,
    coverUrl: dbRecommendation.cover_url,
    status: 'recommendation',
    progress: dbRecommendation.progress || 0,
    pages: dbRecommendation.pages || 0,
    color: dbRecommendation.color,
    genres: dbRecommendation.genres || [],
    dateRead: dbRecommendation.date_read ? new Date(dbRecommendation.date_read) : new Date(),
    recommendedBy: dbRecommendation.recommended_by,
    favorite: dbRecommendation.favorite || false,
    isSeries: dbRecommendation.is_series || false,
    seriesName: dbRecommendation.series_name,
    seriesPosition: dbRecommendation.series_position,
    tags: dbRecommendation.tags || [],
    totalSeriesBooks: dbRecommendation.total_series_books,
    totalSeriesPages: dbRecommendation.total_series_pages,
  };
};

/**
 * Map application book to database recommendation
 */
const mapBookToDbRecommendation = (book: Omit<Book, 'id'> | Partial<Book>): Record<string, any> => {
  const dbRecommendation: Record<string, any> = {
    title: book.title,
    author: book.author,
    cover_url: book.coverUrl,
    status: 'recommendation',
    progress: book.progress,
    pages: book.pages,
    color: book.color,
    genres: book.genres,
    date_read: book.dateRead ? book.dateRead.toISOString() : new Date().toISOString(),
    recommended_by: book.recommendedBy,
    favorite: book.favorite,
    is_series: book.isSeries,
    series_name: book.seriesName,
    series_position: book.seriesPosition,
    tags: book.tags,
    total_series_books: book.totalSeriesBooks,
    total_series_pages: book.totalSeriesPages,
  };
  
  // Remove undefined values to prevent SQL issues
  Object.keys(dbRecommendation).forEach(key => {
    if (dbRecommendation[key] === undefined) {
      delete dbRecommendation[key];
    }
  });
  
  return dbRecommendation;
};

// Define the type for recommendation database record
type RecommendationInsert = {
  title: string;
  author: string;
  status: string;
  progress: number;
  cover_url?: string;
  pages?: number;
  color?: string;
  genres?: string[];
  date_read?: string;
  recommended_by?: string;
  favorite?: boolean;
  is_series?: boolean;
  series_name?: string;
  series_position?: number;
  tags?: string[];
  total_series_books?: number;
  total_series_pages?: number;
};

/**
 * Get all recommendations from the database
 */
export const getAllRecommendations = async (): Promise<Book[]> => {
  // If should use fallback, immediately return localStorage data
  if (shouldUseFallback()) {
    console.log('Using localStorage fallback for recommendations');
    return storageService.getStoredRecommendations();
  }
  
  try {
    const result = await withTimeout(
      supabase
        .from(RECOMMENDATIONS_TABLE)
        .select('*')
        .order('title', { ascending: true }),
      5000
    );

    if (result.error) {
      throw result.error;
    }

    if (!result.data) {
      console.warn('No recommendations found in the database');
      return [];
    }

    return result.data.map(mapDbRecommendationToBook);
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    // Use localStorage as fallback
    const storedRecs = storageService.getStoredRecommendations();
    if (storedRecs.length > 0) {
      console.log('Using localStorage fallback for recommendations');
      return storedRecs;
    }
    return [];
  }
};

/**
 * Add a recommendation to the database
 */
export const addRecommendation = async (book: Omit<Book, 'id'>): Promise<Book> => {
  try {
    // If using fallback, immediately use localStorage
    if (shouldUseFallback()) {
      const id = crypto.randomUUID();
      const newBook = { ...book, id } as Book;
      storageService.addStoredBook(newBook, true);
      return newBook;
    }
    
    // Convert the book to the database format
    const dbRecommendation = mapBookToDbRecommendation(book);
    
    // Explicitly verify that required fields are present
    if (!dbRecommendation.title || !dbRecommendation.author) {
      throw new Error('Recommendation must have a title and author');
    }
    
    // Insert the recommendation into the database with proper typing
    const result = await withTimeout(
      supabase
        .from(RECOMMENDATIONS_TABLE)
        .insert(dbRecommendation as RecommendationInsert)
        .select('*')
        .single(),
      5000
    );

    if (result.error) {
      throw result.error;
    }

    if (!result.data) {
      throw new Error('Failed to add recommendation');
    }

    const newBook = mapDbRecommendationToBook(result.data);
    
    // Also add to localStorage as backup
    storageService.addStoredBook(newBook, true);
    
    return newBook;
  } catch (error) {
    console.error('Error adding recommendation:', error);
    
    // If using fallback, create a new book with UUID
    if (shouldUseFallback()) {
      const id = crypto.randomUUID();
      const newBook = { ...book, id } as Book;
      storageService.addStoredBook(newBook, true);
      return newBook;
    }
    
    throw error;
  }
};

/**
 * Update a recommendation in the database
 */
export const updateRecommendation = async (id: string, bookData: Partial<Book>): Promise<Book> => {
  // If using fallback, immediately use localStorage
  if (shouldUseFallback()) {
    const updatedBook = storageService.updateStoredBook(id, bookData, true);
    if (!updatedBook) {
      throw new Error(`Recommendation with id ${id} not found`);
    }
    return updatedBook;
  }
  
  try {
    const dbRecommendation = mapBookToDbRecommendation(bookData);
    const result = await withTimeout(
      supabase
        .from(RECOMMENDATIONS_TABLE)
        .update(dbRecommendation)
        .eq('id', id)
        .select('*')
        .single(),
      5000
    );

    if (result.error) {
      throw result.error;
    }

    if (!result.data) {
      throw new Error(`Recommendation with id ${id} not found`);
    }

    const updatedBook = mapDbRecommendationToBook(result.data);
    
    // Also update in localStorage as backup
    storageService.updateStoredBook(id, bookData, true);
    
    return updatedBook;
  } catch (error) {
    console.error('Error updating recommendation:', error);
    
    // Try using localStorage as fallback
    const updatedBook = storageService.updateStoredBook(id, bookData, true);
    if (updatedBook) {
      console.log('Used localStorage fallback for updating recommendation');
      return updatedBook;
    }
    
    throw error;
  }
};

/**
 * Delete a recommendation from the database
 */
export const deleteRecommendation = async (id: string): Promise<void> => {
  // If using fallback, immediately use localStorage only
  if (shouldUseFallback()) {
    storageService.deleteStoredBook(id, true);
    return;
  }
  
  try {
    const result = await withTimeout(
      supabase
        .from(RECOMMENDATIONS_TABLE)
        .delete()
        .eq('id', id),
      5000
    );

    if (result.error) {
      throw result.error;
    }
    
    // Also delete from localStorage
    storageService.deleteStoredBook(id, true);
  } catch (error) {
    console.error('Error deleting recommendation:', error);
    
    // Try using localStorage as fallback
    storageService.deleteStoredBook(id, true);
    
    throw error;
  }
};
