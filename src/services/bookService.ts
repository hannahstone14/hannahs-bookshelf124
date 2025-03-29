
import { supabase } from '@/lib/supabase';
import { Book } from '@/types/book';
import { v4 as uuidv4 } from 'uuid';

const BOOKS_TABLE = 'books';
const RECOMMENDATIONS_TABLE = 'recommendations';

// Helper to prepare books for DB insertion
const prepareBookForDB = (book: Omit<Book, 'id'> | Book): any => {
  const bookId = 'id' in book ? book.id : uuidv4();
  
  return {
    id: bookId,
    title: book.title,
    author: book.author,
    cover_url: book.coverUrl,
    status: book.status,
    progress: book.progress,
    pages: book.pages,
    genres: book.genres,
    favorite: book.favorite,
    color: book.color,
    date_read: book.dateRead ? new Date(book.dateRead).toISOString() : new Date().toISOString(),
    recommended_by: book.recommendedBy || null,
    order: book.order || 0
  };
};

// Helper to convert DB response to Book object
const convertDBToBook = (dbBook: any): Book => {
  return {
    id: dbBook.id,
    title: dbBook.title,
    author: dbBook.author,
    coverUrl: dbBook.cover_url,
    status: dbBook.status,
    progress: dbBook.progress,
    pages: dbBook.pages,
    genres: dbBook.genres || [],
    favorite: !!dbBook.favorite,
    color: dbBook.color,
    dateRead: dbBook.date_read ? new Date(dbBook.date_read) : new Date(),
    recommendedBy: dbBook.recommended_by,
    order: dbBook.order || 0
  };
};

// Get all books
export const getAllBooks = async (): Promise<Book[]> => {
  const { data, error } = await supabase
    .from(BOOKS_TABLE)
    .select('*')
    .order('order', { ascending: true });
  
  if (error) {
    console.error('Error fetching books:', error);
    throw error;
  }
  
  return (data || []).map(convertDBToBook);
};

// Get all recommendations
export const getAllRecommendations = async (): Promise<Book[]> => {
  const { data, error } = await supabase
    .from(RECOMMENDATIONS_TABLE)
    .select('*')
    .order('date_read', { ascending: false });
  
  if (error) {
    console.error('Error fetching recommendations:', error);
    throw error;
  }
  
  return (data || []).map(convertDBToBook);
};

// Add a book
export const addBook = async (book: Omit<Book, 'id'>): Promise<Book> => {
  const newBook = prepareBookForDB(book);
  
  const { data, error } = await supabase
    .from(book.status === 'recommendation' ? RECOMMENDATIONS_TABLE : BOOKS_TABLE)
    .insert(newBook)
    .select()
    .single();
  
  if (error) {
    console.error('Error adding book:', error);
    throw error;
  }
  
  return convertDBToBook(data);
};

// Update a book
export const updateBook = async (id: string, bookData: Partial<Book>, isRecommendation: boolean = false): Promise<Book> => {
  const tableName = isRecommendation ? RECOMMENDATIONS_TABLE : BOOKS_TABLE;
  
  // First check if the book exists in the specified table
  const { data: existingBook } = await supabase
    .from(tableName)
    .select('*')
    .eq('id', id)
    .single();
  
  if (!existingBook) {
    throw new Error(`Book with id ${id} not found in ${tableName}`);
  }
  
  // Prepare the update data
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
  
  const { data, error } = await supabase
    .from(tableName)
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating book:', error);
    throw error;
  }
  
  return convertDBToBook(data);
};

// Delete a book
export const deleteBook = async (id: string, isRecommendation: boolean = false): Promise<void> => {
  const { error } = await supabase
    .from(isRecommendation ? RECOMMENDATIONS_TABLE : BOOKS_TABLE)
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting book:', error);
    throw error;
  }
};

// Update book order
export const updateBookOrder = async (orderedIds: string[]): Promise<void> => {
  // Create a batch of updates using an array of promises
  const updates = orderedIds.map((id, index) => {
    return supabase
      .from(BOOKS_TABLE)
      .update({ order: index })
      .eq('id', id);
  });
  
  // Execute all updates concurrently
  await Promise.all(updates);
};
