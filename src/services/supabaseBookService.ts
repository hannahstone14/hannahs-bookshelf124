
import { supabase, BOOKS_TABLE, RECOMMENDATIONS_TABLE } from '@/lib/supabase';
import { Book } from '@/types/book';
import { prepareBookForDB, convertDBToBook } from './bookMappers';

// Get all books from Supabase
export const getAllBooks = async (): Promise<Book[]> => {
  try {
    const { data, error } = await supabase.from(BOOKS_TABLE).select('*');
    
    if (error) {
      console.error('Error fetching books:', error);
      throw error;
    }
    
    // Sort by order
    const sortedData = (data || []).sort((a, b) => (a.order || 0) - (b.order || 0));
    
    return sortedData.map(convertDBToBook);
  } catch (error) {
    console.error('Error in getAllBooks:', error);
    return [];
  }
};

// Get all recommendations from Supabase
export const getAllRecommendations = async (): Promise<Book[]> => {
  try {
    const { data, error } = await supabase.from(RECOMMENDATIONS_TABLE).select('*');
    
    if (error) {
      console.error('Error fetching recommendations:', error);
      throw error;
    }
    
    // Sort by date_read (descending)
    const sortedData = (data || []).sort((a, b) => 
      new Date(b.date_read).getTime() - new Date(a.date_read).getTime()
    );
    
    return sortedData.map(convertDBToBook);
  } catch (error) {
    console.error('Error in getAllRecommendations:', error);
    return [];
  }
};

// Add a book to Supabase
export const addBook = async (book: Omit<Book, 'id'>): Promise<Book> => {
  const newBook = prepareBookForDB(book);
  const tableName = book.status === 'recommendation' ? RECOMMENDATIONS_TABLE : BOOKS_TABLE;
  
  try {
    const { error } = await supabase.from(tableName).insert(newBook);
      
    if (error) {
      console.error('Error adding book:', error);
      throw error;
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

// Update a book in Supabase
export const updateBook = async (
  id: string, 
  bookData: Partial<Book>, 
  isRecommendation: boolean = false
): Promise<Book> => {
  const tableName = isRecommendation ? RECOMMENDATIONS_TABLE : BOOKS_TABLE;
  
  try {
    // First check if the book exists
    const { data: existingBook, error: checkError } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', id)
      .single();
    
    if (checkError || !existingBook) {
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
    
    const { error: updateError } = await supabase
      .from(tableName)
      .update(updateData)
      .eq('id', id);
    
    if (updateError) {
      console.error('Error updating book:', updateError);
      throw updateError;
    }
    
    // Return the updated book
    return {
      ...convertDBToBook(existingBook),
      ...bookData,
      id // Ensure ID is preserved
    } as Book;
  } catch (error) {
    console.error('Error in updateBook:', error);
    throw error;
  }
};

// Delete a book from Supabase
export const deleteBook = async (id: string, isRecommendation: boolean = false): Promise<void> => {
  try {
    const { error } = await supabase
      .from(isRecommendation ? RECOMMENDATIONS_TABLE : BOOKS_TABLE)
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting book:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in deleteBook:', error);
    throw error;
  }
};

// Update book order in Supabase
export const updateBookOrder = async (orderedIds: string[]): Promise<void> => {
  try {
    // Create a batch of updates
    const updatePromises = orderedIds.map((id, index) => {
      return supabase
        .from(BOOKS_TABLE)
        .update({ order: index })
        .eq('id', id);
    });
    
    // Execute all updates concurrently
    await Promise.all(updatePromises);
  } catch (error) {
    console.error('Error in updateBookOrder:', error);
    throw error;
  }
};
