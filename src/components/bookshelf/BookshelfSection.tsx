
import React from 'react';
import { Book } from '@/types/book';
import { LucideIcon } from 'lucide-react';
import BookList from './BookList';
import BookshelfGrid from './BookshelfGrid';

interface BookshelfSectionProps {
  title: string;
  icon: LucideIcon;
  iconColor?: string;
  books: Book[];
  displayStyle: 'shelf' | 'list';
  onEdit: (book: Book) => void;
  onDelete: (bookId: string) => void;
  onDragStart?: (book: Book) => void;
  onDragOver?: (e: React.DragEvent<HTMLDivElement>, book: Book) => void;
  onDrop?: (e: React.DragEvent<HTMLDivElement>, book: Book) => void;
  draggedOverBook?: Book | null;
  showStatus?: boolean;
  emptyMessage?: string;
  emptySubMessage?: string;
}

const BookshelfSection: React.FC<BookshelfSectionProps> = ({
  title,
  icon: Icon,
  iconColor = 'text-blue-700',
  books,
  displayStyle,
  onEdit,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  draggedOverBook,
  showStatus = false,
  emptyMessage = 'No books to display',
  emptySubMessage,
}) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-medium flex items-center border-b border-gray-200 pb-2 mb-3">
        <Icon className={`h-5 w-5 mr-2 ${iconColor}`} />
        {title}
      </h2>
      
      {books.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-md">
          <p className="text-gray-500">{emptyMessage}</p>
          {emptySubMessage && (
            <p className="text-sm text-gray-400 mt-2">{emptySubMessage}</p>
          )}
        </div>
      ) : (
        displayStyle === 'list' ? (
          <BookList books={books} onEdit={onEdit} onDelete={onDelete} />
        ) : (
          <BookshelfGrid 
            books={books} 
            onEdit={onEdit} 
            onDelete={onDelete}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
            draggedOverBook={draggedOverBook}
            showStatus={showStatus}
          />
        )
      )}
    </div>
  );
};

export default BookshelfSection;
