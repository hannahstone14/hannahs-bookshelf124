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
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/firebaseConfig';
import { useNavigate } from 'react-router-dom';

// Placeholder: Assume an AuthContext exists
// import { useAuth } from '@/context/AuthContext'; 

type DisplayStyle = 'shelf' | 'list';

const Bookshelf: React.FC = () => {
  const isMounted = useRef(true);
  const navigate = useNavigate();
  
  // Get authentication status from Firebase hook
  const [user, loadingAuth] = useAuthState(auth);
  // Check if the logged-in user is the allowed user
  const isAllowedUser = user?.email === 'hstone1416@gmail.com';
  
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
        // First separate reading books from other books
        const readingBooks = allShelfBooks.filter(book => book.status === 'reading')
          .sort((a, b) => {
            // Sort by dateRead (most recent first)
            if (a.dateRead && b.dateRead) {
              const dateA = a.dateRead instanceof Date ? a.dateRead.getTime() : new Date(a.dateRead).getTime();
              const dateB = b.dateRead instanceof Date ? b.dateRead.getTime() : new Date(b.dateRead).getTime();
              return dateB - dateA; // Most recent first
            }
            return 0;
          });
        
        // Then get the rest of the books
        const otherBooks = allShelfBooks.filter(book => book.status !== 'reading');
        const sortedOtherBooks = getSortedBooks(otherBooks);
        
        // Combine with reading books first
        displayedBooks = [...readingBooks, ...sortedOtherBooks];
        break;
    }
    
    setBooksToDisplay(displayedBooks);
  }, [viewTab, sortBy, sortOrder, books, recommendations, getSortedBooks, allShelfBooks, toReadBooks]);

  const handleTabChange = useCallback((value: string) => {
    const newTab = value as ViewTab;
    setViewTab(newTab);
    
    if (newTab === 'shelf' || newTab === 'list') {
      setDisplayStyle(newTab);
    }
  }, []);
  
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
    
    // Use the actual auth state and check for the specific user
    if (!isAllowedUser) { 
      alert('You do not have permission to edit books.'); 
      console.log("User not authorized. Redirecting to login...");
      navigate('/login'); // Redirect to login page
      return;
    }
    
    setSelectedBook(book);
    setIsEditDialogOpen(true);
  }, [isAllowedUser, navigate]);

  const handleDelete = useCallback((bookId: string) => {
    if (!isAllowedUser) {
      alert('You do not have permission to delete books.');
      console.log("User not authorized for delete. Redirecting to login...");
      navigate('/login'); // Redirect to login page
      return;
    }
    removeBook(bookId);
  }, [removeBook, isAllowedUser, navigate]);

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
    if (!isMounted.current) return;

    // Use the actual auth state and check for the specific user
    if (!isAllowedUser) { 
      alert('Please log in with the authorized account to add books.');
      console.log("User not authorized. Redirecting to login...");
      navigate('/login'); // Redirect to login page
      return;
    }
    
    setIsAddDialogOpen(true);
  }, [isAllowedUser, navigate]);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-end mb-6">
        <Button 
          className="bg-gray-900 hover:bg-gray-700 text-white text-sm px-4 py-2 rounded-md"
          id="add-book-button"
          onClick={handleAddBookClick}
        >
          <PlusCircle className="h-4 w-4 mr-2" />
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

      {/* Header Row: Title + Tabs/Sort */}
      <div className="flex justify-between items-center border-b border-gray-200 pb-3 mb-6">
        {/* Removing the H2 title from here */}
        {/* <h2 className="text-xl font-medium flex items-center">
          <BookOpen className={`h-5 w-5 mr-2 text-blue-700`} />
          Bookshelf
        </h2> */}
        {/* Keep the Tabs/Sort */}
        <BookshelfTabs 
          activeTab={viewTab}
          onTabChange={handleTabChange}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
        />
      </div>
      
      {books.length === 0 && recommendations.length === 0 ? (
        <EmptyBookshelf onAddBookClick={handleAddBookClick} />
      ) : (
        <>
          {viewTab === 'recommendations' ? (
            <BookshelfSection
              title="Recommendations"
              icon={LightbulbIcon}
              iconColor="text-yellow-500"
              books={booksToDisplay}
              displayStyle={displayStyle}
              onEdit={handleEdit}
              onDelete={handleDelete}
              draggedOverBook={draggedOverBook}
              emptyMessage="No recommendations yet"
              emptySubMessage="Recommendations from friends will appear here"
              cardClassName="bg-white border border-gray-200 rounded-lg shadow-sm"
            />
          ) :
          viewTab === 'to-read' ? (
            <BookshelfSection
              title="To Read"
              icon={Bookmark}
              iconColor="text-blue-500"
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
              cardClassName="bg-white border border-gray-200 rounded-lg shadow-sm"
            />
          ) : (
            <BookshelfSection
              title="Bookshelf"
              icon={BookOpen}
              iconColor="text-gray-700"
              books={booksToDisplay}
              displayStyle={displayStyle}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              draggedOverBook={draggedOverBook}
              showStatus={true}
              cardClassName="bg-white border border-gray-200 rounded-lg shadow-sm"
            />
          )}
        </>
      )}
    </div>
  );
};

export default Bookshelf;
