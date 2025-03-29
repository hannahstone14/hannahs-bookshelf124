
import { supabase } from '@/integrations/supabase/client';
import { Book } from '@/types/book';
import { RECOMMENDATIONS_TABLE, SupabaseResponse } from '@/lib/supabase';
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

/**
 * Get all recommendations from the database
 */
export const getAllRecommendations = async (): Promise<Book[]> => {
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
    return [];
  }
};

/**
 * Add a recommendation to the database
 */
export const addRecommendation = async (book: Omit<Book, 'id'>): Promise<Book> => {
  try {
    // Convert the book to the database format
    const dbRecommendation = mapBookToDbRecommendation(book);
    
    // Explicitly verify that required fields are present
    if (!dbRecommendation.title || !dbRecommendation.author) {
      throw new Error('Recommendation must have a title and author');
    }
    
    // Explicitly type the recommendation for TypeScript
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

    return mapDbRecommendationToBook(result.data);
  } catch (error) {
    console.error('Error adding recommendation:', error);
    throw error;
  }
};

/**
 * Update a recommendation in the database
 */
export const updateRecommendation = async (id: string, bookData: Partial<Book>): Promise<Book> => {
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

    return mapDbRecommendationToBook(result.data);
  } catch (error) {
    console.error('Error updating recommendation:', error);
    throw error;
  }
};

/**
 * Delete a recommendation from the database
 */
export const deleteRecommendation = async (id: string): Promise<void> => {
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
  } catch (error) {
    console.error('Error deleting recommendation:', error);
    throw error;
  }
};
