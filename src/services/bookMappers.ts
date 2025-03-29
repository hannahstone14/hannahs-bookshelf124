import { Book } from '@/types/book';
import { Tables } from '@/integrations/supabase/types';
import { v4 as uuidv4 } from 'uuid';

// Prepare a book object for insertion into the Supabase database
export const prepareBookForDB = (book: Omit<Book, 'id'>): Tables<'books'>['Insert'] => {
  const newBookId = uuidv4();
  
  return {
    id: newBookId,
    title: book.title,
    author: book.author,
    cover_url: book.coverUrl || null,
    date_read: book.dateRead ? new Date(book.dateRead).toISOString() : null,
    genres: book.genres || [],
    status: book.status,
    progress: book.progress,
    pages: book.pages || null,
    recommended_by: book.recommendedBy || null,
    favorite: book.favorite || false,
    order: book.order || null,
    color: book.color || null,
    is_series: book.isSeries || false,
    series_name: book.seriesName || null,
    series_position: book.seriesPosition || null
  };
};

// Convert a book object from the Supabase database to the Book type
export const convertDBToBook = (dbBook: Tables<'books'>['Row']): Book => {
  return {
    id: dbBook.id,
    title: dbBook.title,
    author: dbBook.author,
    coverUrl: dbBook.cover_url || '',
    dateRead: dbBook.date_read ? new Date(dbBook.date_read) : new Date(),
    genres: dbBook.genres || [],
    status: dbBook.status as Book['status'],
    progress: dbBook.progress,
    pages: dbBook.pages || 0,
    recommendedBy: dbBook.recommended_by || '',
    favorite: dbBook.favorite || false,
    order: dbBook.order || 0,
    color: dbBook.color || undefined,
    isSeries: dbBook.is_series || false,
    seriesName: dbBook.series_name || undefined,
    seriesPosition: dbBook.series_position || undefined
  };
};
