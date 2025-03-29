
import { Book } from '@/types/book';
import { v4 as uuidv4 } from 'uuid';

// Helper to prepare books for DB insertion
export const prepareBookForDB = (book: Omit<Book, 'id'> | Book): any => {
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
export const convertDBToBook = (dbBook: any): Book => {
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
