
import React from 'react';
import { Book } from '@/types/book';
import { BookOpen, Bookmark, LightbulbIcon } from 'lucide-react';
import BookshelfSection from './BookshelfSection';
import BookshelfTabs, { ViewTab, SortOption } from './BookshelfTabs';

interface BookshelfContentProps {
  viewTab: ViewTab;
  sortBy: SortOption;
  sortOrder: 'asc' | 'desc';
  displayStyle: 'shelf' | 'list';
  booksToDisplay: Book[];
  draggedOverBook: Book | null;
  onTabChange: (value: string) => void;
  onSort: (option: SortOption) => void;
  onEdit: (book: Book) => void;
  onDelete: (bookId: string) => void;
  onDragStart: (book: Book) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>, book: Book) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>, book: Book) => void;
}

const BookshelfContent: React.FC<BookshelfContentProps> = ({
  viewTab,
  sortBy,
  sortOrder,
  displayStyle,
  booksToDisplay,
  draggedOverBook,
  onTabChange,
  onSort,
  onEdit,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop
}) => {
  return (
    <>
      <BookshelfTabs 
        viewTab={viewTab}
        onTabChange={onTabChange}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={onSort}
      />

      {viewTab === 'recommendations' ? (
        <BookshelfSection
          title="Book Recommendations From Others"
          icon={LightbulbIcon}
          iconColor="text-yellow-500"
          books={booksToDisplay}
          displayStyle={displayStyle}
          onEdit={onEdit}
          onDelete={onDelete}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDrop={onDrop}
          draggedOverBook={draggedOverBook}
          emptyMessage="No recommendations yet"
          emptySubMessage="Recommendations will appear when others add books without a verification code"
        />
      ) : viewTab === 'to-read' ? (
        <BookshelfSection
          title="Books To Read"
          icon={Bookmark}
          iconColor="text-amber-600"
          books={booksToDisplay}
          displayStyle={displayStyle}
          onEdit={onEdit}
          onDelete={onDelete}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDrop={onDrop}
          draggedOverBook={draggedOverBook}
          emptyMessage="Your To Read list is empty"
          emptySubMessage="Add books you want to read next"
        />
      ) : (
        <BookshelfSection
          title="Bookshelf"
          icon={BookOpen}
          iconColor="text-green-600"
          books={booksToDisplay}
          displayStyle={displayStyle}
          onEdit={onEdit}
          onDelete={onDelete}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDrop={onDrop}
          draggedOverBook={draggedOverBook}
          showStatus={true}
        />
      )}
    </>
  );
};

export default BookshelfContent;
