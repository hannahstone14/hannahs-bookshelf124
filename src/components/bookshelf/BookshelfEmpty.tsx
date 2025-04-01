
import React from 'react';
import EmptyBookshelf from './EmptyBookshelf';

interface BookshelfEmptyProps {
  onAddBook: () => void;
}

const BookshelfEmpty: React.FC<BookshelfEmptyProps> = ({ onAddBook }) => {
  return <EmptyBookshelf onAddBook={onAddBook} />;
};

export default BookshelfEmpty;
