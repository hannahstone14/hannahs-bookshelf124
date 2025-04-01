import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useBookshelf } from '@/context/BookshelfContext';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { BookOpen, BookOpenCheck, Bookmark, LightbulbIcon, BookMarked } from 'lucide-react';
import AddBookForm from './AddBookForm';
import { Book } from '@/types/book';
import BookshelfTabs, { ViewTab, SortOption } from './bookshelf/BookshelfTabs';
import EmptyBookshelf from './bookshelf/EmptyBookshelf';
import BookshelfSection from './bookshelf/BookshelfSection';
import { Button } from './ui/button';
import { PlusCircle } from 'lucide-react';

type DisplayStyle = 'shelf' | 'list';

const Bookshelf: React.FC = () => {
  const isMounted = useRef(true);
  
  const { books, recommendations, reorderBooks, removeBook } = useBookshelf();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  
  const [viewTab, setViewTab] = useState<ViewTab>('shelf');
  const [displayStyle, setDisplayStyle] = useState<DisplayStyle>('shelf');
  
  const [draggedBook, setDraggedBook] = useState<Book | null>(null);
  const [draggedOverBook, setDraggedOverBook] = useState<Book | null>(null);
  
  const [sortBy, setSortBy] = useState<SortOption>('dateRead');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [booksToDisplay, setBooksToDisplay] = useState<Book[]>([]);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  const allShelfBooks = books.filter(book => book.status !== 'to-read');
  
  const toReadBooks: Book[] = [];
  
  const seriesBooks = books.filter(book => book.isSeries);
  const uniqueSeriesNames = new Set();
  
  seriesBooks.forEach(book => {
    if (book.seriesName) {
      uniqueSeriesNames.add(book.seriesName);
    } else {
      uniqueSeriesNames.add(book.id);
    }
  });
  
  const seriesCount = uniqueSeriesNames.size;
  
  useEffect(() => {
    if (!isMounted.current) return;
    
    let displayedBooks: Book[] = [];
    
    switch(viewTab) {
      case 'to-read':
        displayedBooks = getSortedBooks(toReadBooks);
        break;
      case 'recommendations':
        displayedBooks = getSortedBooks(recommendations);
        break;
      case 'shelf':
      case 'list':
      default:
        displayedBooks = getSortedBooks(allShelfBooks);
        break;
    }
    
    setBooksToDisplay(displayedBooks);
  }, [viewTab, sortBy, sortOrder, books, recommendations]);

  const handleTabChange = useCallback((value: string) => {
    const newTab = value as ViewTab;
    setViewTab(newTab);
    
    if (newTab === 'shelf' || newTab === 'list') {
      setDisplayStyle(newTab);
    }
  }, []);
  
  const getSortedBooks = useCallback((booksToSort: Book[]) => {
    return [...booksToSort].sort((a, b) => {
      let comparison = 0;
      
      switch(sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'author':
          comparison = a.author.localeCompare(b.author);
          break;
        case 'dateRead':
          if (!a.dateRead) return sortOrder === 'asc' ? -1 : 1;
          if (!b.dateRead) return sortOrder === 'asc' ? 1 : -1;
          
          const dateA = a.dateRead instanceof Date ? a.dateRead.getTime() : new Date(a.dateRead).getTime();
          const dateB = b.dateRead instanceof Date ? b.dateRead.getTime() : new Date(b.dateRead).getTime();
          
          comparison = dateA - dateB;
          break;
        case 'progress':
          comparison = a.progress - b.progress;
          break;
        case 'favorite':
          comparison = (a.favorite === b.favorite) ? 0 : a.favorite ? -1 : 1;
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [sortBy, sortOrder]);
  
  const handleSort = useCallback((option: SortOption) => {
    if (sortBy === option) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(option);
      setSortOrder('desc');
    }
  }, [sortBy, sortOrder]);
  
  const handleDragStart = useCallback((book: Book) => {
    setDraggedBook(book);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>, book: Book) => {
    e.preventDefault();
    if (draggedBook?.id !== book.id) {
      setDraggedOverBook(book);
    }
  }, [draggedBook]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>, targetBook: Book) => {
    e.preventDefault();
    
    if (!draggedBook) return;
    
    const displayBooks = viewTab === 'to-read' ? toReadBooks : allShelfBooks;
    const allBooks = getSortedBooks(books);
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
  }, [draggedBook, viewTab, toReadBooks, allShelfBooks, books, getSortedBooks, reorderBooks]);

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

      <Dialog open={isAddDialogOpen} onOpenChange={handleAddDialogOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogTitle>Add New Book</DialogTitle>
          <AddBookForm 
            isOpen={isAddDialogOpen} 
            onClose={() => setIsAddDialogOpen(false)} 
            onSuccess={handleAddSuccess} 
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={handleEditDialogOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogTitle>Edit Book</DialogTitle>
          {selectedBook && (
            <AddBookForm 
              isOpen={isEditDialogOpen}
              onClose={() => setIsEditDialogOpen(false)}
              onSuccess={handleEditSuccess} 
              bookToEdit={selectedBook}
            />
          )}
        </DialogContent>
      </Dialog>

      {books.length === 0 && recommendations.length === 0 ? (
        <EmptyBookshelf onAddBook={handleAddBookClick} />
      ) : (
        <>
          <BookshelfTabs 
            viewTab={viewTab}
            onTabChange={handleTabChange}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
          />

          {viewTab === 'recommendations' ? (
            <BookshelfSection
              title="Book Recommendations From Others"
              icon={LightbulbIcon}
              iconColor="text-yellow-500"
              books={booksToDisplay}
              displayStyle={displayStyle}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
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
              onEdit={handleEdit}
              onDelete={handleDelete}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
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
              onEdit={handleEdit}
              onDelete={handleDelete}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              draggedOverBook={draggedOverBook}
              showStatus={true}
            />
          )}
        </>
      )}
    </div>
  );
};

export default Bookshelf;
