
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useBookshelf } from '@/context/BookshelfContext';
import { Book } from '@/types/book';
import { Button } from './ui/button';
import { PlusCircle } from 'lucide-react';
import { useBookshelfData } from '@/hooks/useBookshelfData';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';
import BookDialogs from './bookshelf/BookDialogs';
import BookshelfEmpty from './bookshelf/BookshelfEmpty';
import BookshelfContent from './bookshelf/BookshelfContent';

const Bookshelf: React.FC = () => {
  const isMounted = useRef(true);
  const { books, recommendations, reorderBooks, removeBook } = useBookshelf();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  
  // Use the custom hooks
  const {
    viewTab, 
    displayStyle,
    sortBy,
    sortOrder,
    booksToDisplay,
    handleTabChange,
    handleSort
  } = useBookshelfData(books, recommendations);
  
  const {
    draggedOverBook,
    handleDragStart,
    handleDragOver,
    handleDrop
  } = useDragAndDrop(books, reorderBooks);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleEdit = useCallback((book: Book) => {
    if (!isMounted.current) return;
    
    setSelectedBook(book);
    setIsEditDialogOpen(true);
  }, []);

  const handleDelete = useCallback((bookId: string) => {
    removeBook(bookId);
  }, [removeBook]);

  const handleAddDialogOpenChange = useCallback((open: boolean) => {
    if (!isMounted.current) return;
    setIsAddDialogOpen(open);
  }, []);

  const handleEditDialogOpenChange = useCallback((open: boolean) => {
    if (!isMounted.current) return;
    setIsEditDialogOpen(open);
    if (!open) {
      setTimeout(() => {
        if (isMounted.current) {
          setSelectedBook(null);
        }
      }, 100);
    }
  }, []);

  const handleAddSuccess = useCallback(() => {
    if (!isMounted.current) return;
    setIsAddDialogOpen(false);
  }, []);

  const handleEditSuccess = useCallback(() => {
    if (!isMounted.current) return;
    setIsEditDialogOpen(false);
    
    setTimeout(() => {
      if (isMounted.current) {
        setSelectedBook(null);
      }
    }, 100);
  }, []);

  const handleAddBookClick = useCallback(() => {
    if (isMounted.current) {
      setIsAddDialogOpen(true);
    }
  }, []);

  // Modified handleDrop for the BookshelfContent component
  const handleContentDrop = useCallback((e: React.DragEvent<HTMLDivElement>, book: Book) => {
    handleDrop(e, book, booksToDisplay);
  }, [handleDrop, booksToDisplay]);

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="flex justify-end mb-4">
        <Button 
          className="bg-blue-700 hover:bg-blue-800 text-md px-6 py-2 h-12"
          id="add-book-button"
          onClick={handleAddBookClick}
        >
          <PlusCircle className="h-5 w-5 mr-2" />
          Add Book
        </Button>
      </div>

      <BookDialogs 
        isAddDialogOpen={isAddDialogOpen}
        isEditDialogOpen={isEditDialogOpen}
        selectedBook={selectedBook}
        handleAddDialogOpenChange={handleAddDialogOpenChange}
        handleEditDialogOpenChange={handleEditDialogOpenChange}
        handleAddSuccess={handleAddSuccess}
        handleEditSuccess={handleEditSuccess}
      />

      {books.length === 0 && recommendations.length === 0 ? (
        <BookshelfEmpty onAddBook={handleAddBookClick} />
      ) : (
        <BookshelfContent 
          viewTab={viewTab}
          sortBy={sortBy}
          sortOrder={sortOrder}
          displayStyle={displayStyle}
          booksToDisplay={booksToDisplay}
          draggedOverBook={draggedOverBook}
          onTabChange={handleTabChange}
          onSort={handleSort}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleContentDrop}
        />
      )}
    </div>
  );
};

export default Bookshelf;
