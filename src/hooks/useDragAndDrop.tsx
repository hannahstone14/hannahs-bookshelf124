
import { useState, useCallback } from 'react';
import { Book } from '@/types/book';

export const useDragAndDrop = (books: Book[], reorderBooks: (oldOrder: string[], newOrder: string[]) => void) => {
  const [draggedBook, setDraggedBook] = useState<Book | null>(null);
  const [draggedOverBook, setDraggedOverBook] = useState<Book | null>(null);
  
  const handleDragStart = useCallback((book: Book) => {
    setDraggedBook(book);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>, book: Book) => {
    e.preventDefault();
    if (draggedBook?.id !== book.id) {
      setDraggedOverBook(book);
    }
  }, [draggedBook]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>, targetBook: Book, displayBooks: Book[]) => {
    e.preventDefault();
    
    if (!draggedBook) return;
    
    const allBooks = [...books];
    const sourceIndex = allBooks.findIndex(book => book.id === draggedBook.id);
    const targetIndex = allBooks.findIndex(book => book.id === targetBook.id);
    
    if (sourceIndex !== -1 && targetIndex !== -1) {
      const newBooks = [...allBooks];
      const [movedBook] = newBooks.splice(sourceIndex, 1);
      newBooks.splice(targetIndex, 0, movedBook);
      
      reorderBooks(allBooks.map(b => b.id), newBooks.map(b => b.id));
    }
    
    setDraggedBook(null);
    setDraggedOverBook(null);
  }, [draggedBook, books, reorderBooks]);

  return {
    draggedBook,
    draggedOverBook,
    handleDragStart,
    handleDragOver,
    handleDrop
  };
};
