
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

// Check if we should use localStorage fallback (simplified check)
const shouldUseFallback = () => {
  return !supabase || typeof supabase.from !== 'function';
};

// Get all books
export const getAllBooks = async (): Promise<Book[]> => {
  // Fallback to empty array if using mock client
  if (shouldUseFallback()) {
    try {
      const storedBooks = localStorage.getItem('books');
      return storedBooks ? JSON.parse(storedBooks) : [];
    } catch (error) {
      console.error('Error getting books from localStorage:', error);
      return [];
    }
  }
  
  try {
    // Fix the promise chain issue by extracting each result separately
    const query = supabase.from(BOOKS_TABLE).select('*');
    const orderResult = await Promise.resolve(query);
    
    if (orderResult.error) {
      console.error('Error fetching books:', orderResult.error);
      throw orderResult.error;
    }
    
    // Sort by order
    const sortedData = (orderResult.data || []).sort((a, b) => (a.order || 0) - (b.order || 0));
    
    return sortedData.map(convertDBToBook);
  } catch (error) {
    console.error('Error in getAllBooks:', error);
    return [];
  }
};

// Get all recommendations
export const getAllRecommendations = async (): Promise<Book[]> => {
  // Fallback to empty array if using mock client
  if (shouldUseFallback()) {
    try {
      const storedRecommendations = localStorage.getItem('recommendations');
      return storedRecommendations ? JSON.parse(storedRecommendations) : [];
    } catch (error) {
      console.error('Error getting recommendations from localStorage:', error);
      return [];
    }
  }
  
  try {
    // Fix the promise chain issue by extracting each result separately
    const query = supabase.from(RECOMMENDATIONS_TABLE).select('*');
    const orderResult = await Promise.resolve(query);
    
    if (orderResult.error) {
      console.error('Error fetching recommendations:', orderResult.error);
      throw orderResult.error;
    }
    
    // Sort by date_read (descending)
    const sortedData = (orderResult.data || []).sort((a, b) => 
      new Date(b.date_read).getTime() - new Date(a.date_read).getTime()
    );
    
    return sortedData.map(convertDBToBook);
  } catch (error) {
    console.error('Error in getAllRecommendations:', error);
    return [];
  }
};

// Add a book
export const addBook = async (book: Omit<Book, 'id'>): Promise<Book> => {
  const newBook = prepareBookForDB(book);
  
  // If using localStorage, generate a new book and store it
  if (shouldUseFallback()) {
    const bookWithId = {
      ...book,
      id: newBook.id,
    } as Book;
    
    // Save to localStorage
    try {
      const storageKey = book.status === 'recommendation' ? 'recommendations' : 'books';
      const existing = localStorage.getItem(storageKey);
      const items = existing ? JSON.parse(existing) : [];
      localStorage.setItem(storageKey, JSON.stringify([...items, bookWithId]));
      
      return bookWithId;
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      throw error;
    }
  }
  
  try {
    const tableName = book.status === 'recommendation' ? RECOMMENDATIONS_TABLE : BOOKS_TABLE;
    
    // Fix the promise chain issue by simplifying the insert operation
    const result = await Promise.resolve(supabase.from(tableName).insert(newBook));
      
    // Fetch the inserted record
    if (result.error) {
      console.error('Error adding book:', result.error);
      throw result.error;
    }
    
    // Return the book with the generated ID
    return {
      ...book,
      id: newBook.id
    } as Book;
  } catch (error) {
    console.error('Error in addBook:', error);
    throw error;
  }
};

// Update a book
export const updateBook = async (id: string, bookData: Partial<Book>, isRecommendation: boolean = false): Promise<Book> => {
  const tableName = isRecommendation ? RECOMMENDATIONS_TABLE : BOOKS_TABLE;
  
  // If using localStorage, update the book directly
  if (shouldUseFallback()) {
    try {
      const storageKey = isRecommendation ? 'recommendations' : 'books';
      const existing = localStorage.getItem(storageKey);
      
      if (!existing) {
        throw new Error(`No ${storageKey} found in localStorage`);
      }
      
      const items = JSON.parse(existing);
      const itemIndex = items.findIndex((item: Book) => item.id === id);
      
      if (itemIndex === -1) {
        throw new Error(`Book with id ${id} not found in ${storageKey}`);
      }
      
      const updatedBook = { ...items[itemIndex], ...bookData };
      items[itemIndex] = updatedBook;
      
      localStorage.setItem(storageKey, JSON.stringify(items));
      
      return updatedBook;
    } catch (error) {
      console.error('Error updating book in localStorage:', error);
      throw error;
    }
  }
  
  try {
    // First check if the book exists in the specified table
    const checkQuery = supabase.from(tableName).select('*').eq('id', id);
    const checkResult = await Promise.resolve(checkQuery);
    
    const existingBook = checkResult.data?.[0];
    
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
    
    // Fix the promise chain issue by simplifying the update operation
    const updateQuery = supabase.from(tableName).update(updateData).eq('id', id);
    const updateResult = await Promise.resolve(updateQuery);
    
    if (updateResult.error) {
      console.error('Error updating book:', updateResult.error);
      throw updateResult.error;
    }
    
    // Return the updated book
    return {
      ...existingBook,
      ...bookData,
      id // Ensure ID is preserved
    } as Book;
  } catch (error) {
    console.error('Error in updateBook:', error);
    throw error;
  }
};

// Delete a book
export const deleteBook = async (id: string, isRecommendation: boolean = false): Promise<void> => {
  // If using localStorage, delete the book directly
  if (shouldUseFallback()) {
    try {
      const storageKey = isRecommendation ? 'recommendations' : 'books';
      const existing = localStorage.getItem(storageKey);
      
      if (!existing) {
        return; // Nothing to delete
      }
      
      const items = JSON.parse(existing);
      const updatedItems = items.filter((item: Book) => item.id !== id);
      
      localStorage.setItem(storageKey, JSON.stringify(updatedItems));
      
      return;
    } catch (error) {
      console.error('Error deleting book from localStorage:', error);
      throw error;
    }
  }
  
  try {
    // Fix the promise chain issue by simplifying the delete operation
    const deleteQuery = supabase.from(isRecommendation ? RECOMMENDATIONS_TABLE : BOOKS_TABLE).delete().eq('id', id);
    const { error } = await Promise.resolve(deleteQuery);
    
    if (error) {
      console.error('Error deleting book:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in deleteBook:', error);
    throw error;
  }
};

// Update book order
export const updateBookOrder = async (orderedIds: string[]): Promise<void> => {
  // If using localStorage, update the order directly
  if (shouldUseFallback()) {
    try {
      const existing = localStorage.getItem('books');
      
      if (!existing) {
        return; // Nothing to update
      }
      
      const books = JSON.parse(existing);
      
      // Create a map of id to books
      const bookMap = books.reduce((map: any, book: Book) => {
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
      
      return;
    } catch (error) {
      console.error('Error updating book order in localStorage:', error);
      throw error;
    }
  }
  
  try {
    // Create a batch of updates
    const updatePromises = orderedIds.map((id, index) => {
      const query = supabase.from(BOOKS_TABLE).update({ order: index }).eq('id', id);
      return Promise.resolve(query);
    });
    
    // Execute all updates concurrently
    await Promise.all(updatePromises);
  } catch (error) {
    console.error('Error in updateBookOrder:', error);
    throw error;
  }
};
