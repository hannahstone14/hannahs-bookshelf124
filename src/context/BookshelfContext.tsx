
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Book } from '@/types/book';
import { v4 as uuidv4 } from 'uuid';
import { toast } from "sonner";

interface BookshelfContextType {
  books: Book[];
  addBook: (book: Omit<Book, 'id'>) => void;
  removeBook: (id: string) => void;
  editBook: (id: string, bookData: Partial<Book>) => void;
}

const BookshelfContext = createContext<BookshelfContextType | undefined>(undefined);

export const useBookshelf = () => {
  const context = useContext(BookshelfContext);
  if (context === undefined) {
    throw new Error('useBookshelf must be used within a BookshelfProvider');
  }
  return context;
};

export const BookshelfProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [books, setBooks] = useState<Book[]>(() => {
    const savedBooks = localStorage.getItem('bookshelf');
    if (savedBooks) {
      try {
        // Parse the dates back to Date objects
        const parsedBooks = JSON.parse(savedBooks);
        return parsedBooks.map((book: any) => ({
          ...book,
          dateRead: new Date(book.dateRead)
        }));
      } catch (error) {
        console.error('Failed to parse books from localStorage:', error);
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    // Convert Date objects to ISO strings for storage
    const booksToStore = books.map(book => ({
      ...book,
      dateRead: book.dateRead.toISOString()
    }));
    localStorage.setItem('bookshelf', JSON.stringify(booksToStore));
  }, [books]);

  const addBook = (book: Omit<Book, 'id'>) => {
    const newBook = {
      ...book,
      id: uuidv4()
    };
    setBooks(currentBooks => [newBook, ...currentBooks]);
    toast.success('Book added to your shelf!');
  };

  const removeBook = (id: string) => {
    setBooks(currentBooks => currentBooks.filter(book => book.id !== id));
    toast.info('Book removed from your shelf');
  };

  const editBook = (id: string, bookData: Partial<Book>) => {
    setBooks(currentBooks => 
      currentBooks.map(book => 
        book.id === id ? { ...book, ...bookData } : book
      )
    );
    toast.success('Book updated successfully!');
  };

  const value = {
    books,
    addBook,
    removeBook,
    editBook
  };

  return (
    <BookshelfContext.Provider value={value}>
      {children}
    </BookshelfContext.Provider>
  );
};
