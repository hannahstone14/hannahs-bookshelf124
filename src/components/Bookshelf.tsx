import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useBookshelf } from '@/context/BookshelfContext';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { BookOpen, BookOpenCheck, Bookmark, LightbulbIcon, BookMarked } from 'lucide-react';
import AddBookForm from './AddBookForm';
import { Book } from '@/types/book';
import EmptyBookshelf from './bookshelf/EmptyBookshelf';
import BookshelfGrid from './bookshelf/BookshelfGrid';
import BookList from './bookshelf/BookList';
import { Button } from './ui/button';
import { PlusCircle } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/firebaseConfig';
import { useNavigate } from 'react-router-dom';
import BookshelfSection from './bookshelf/BookshelfSection';

// Add types for props that will be passed down
export type ViewTab = 'shelf' | 'list' | 'to-read' | 'recommendations';
export type SortOption = 'title' | 'author' | 'dateRead' | 'progress' | 'favorite';

// Placeholder: Assume an AuthContext exists
// import { useAuth } from '@/context/AuthContext'; 

type DisplayStyle = 'shelf' | 'list';

// Define props Bookshelf will now expect
interface BookshelfProps {
  isAddDialogOpen: boolean;
  onDialogClose: () => void;
  onAddBookClick: () => void; // Handler for EmptyBookshelf button
  viewTab: ViewTab;
  sortBy: SortOption;
  sortOrder: 'asc' | 'desc';
  // Note: onTabChange and onSort handlers are not needed here anymore
  // as the controls are moving to BookshelfStats
}

const Bookshelf: React.FC<BookshelfProps> = ({ 
  isAddDialogOpen, 
  onDialogClose, 
  onAddBookClick, // Receive handler for empty state
  viewTab,        // Receive viewTab state
  sortBy,         // Receive sortBy state
  sortOrder       // Receive sortOrder state
}) => { 
  const isMounted = useRef(true);
  const navigate = useNavigate();
  
  // Get authentication status from Firebase hook
  const [user, loadingAuth] = useAuthState(auth);
  // Check if the logged-in user is the allowed user
  const isAllowedUser = user?.email === 'hstone1416@gmail.com';
  
  const { books, recommendations, reorderBooks, removeBook } = useBookshelf();
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  
  const [displayStyle, setDisplayStyle] = useState<DisplayStyle>('shelf'); // Keep this for internal grid/list toggle
  
  const [draggedBook, setDraggedBook] = useState<Book | null>(null);
  const [draggedOverBook, setDraggedOverBook] = useState<Book | null>(null);
  
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

  // Use props for sorting
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
  
  // Use props in useEffect
  useEffect(() => {
    if (!isMounted.current) return;
    
    let displayedBooks: Book[] = [];
    
    switch(viewTab) { // Use viewTab from props
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
    // Update displayStyle when viewTab changes
    if (viewTab === 'shelf' || viewTab === 'list') {
      setDisplayStyle(viewTab);
    }
  }, [viewTab, sortBy, sortOrder, books, recommendations, getSortedBooks, allShelfBooks, toReadBooks]); // Depend on props

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

  const handleEditSuccess = useCallback(() => {
    if (!isMounted.current) return;
    setIsEditDialogOpen(false);
    
    setTimeout(() => {
      if (isMounted.current) {
        setSelectedBook(null);
      }
    }, 100);
  }, []);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (draggedBook) {
      setDraggedOverBook(draggedBook);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    if (!draggedBook) return;
    
    const allBooks = getSortedBooks(books);
    const sourceIndex = allBooks.findIndex(book => book.id === draggedBook.id);
    const targetIndex = allBooks.findIndex(book => book.id === draggedOverBook?.id);
    
    if (sourceIndex !== -1 && targetIndex !== -1) {
      const newBooks = [...allBooks];
      const [movedBook] = newBooks.splice(sourceIndex, 1);
      newBooks.splice(targetIndex, 0, movedBook);
      
      reorderBooks(allBooks.map(b => b.id), newBooks.map(b => b.id));
    }
    
    setDraggedBook(null);
    setDraggedOverBook(null);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-end mb-6">
        <Button 
          className="bg-gray-900 hover:bg-gray-700 text-white text-sm px-4 py-2 rounded-md"
          id="add-book-button"
          onClick={onAddBookClick}
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Book
        </Button>
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={onDialogClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogTitle>Add New Book</DialogTitle>
          <AddBookForm 
            isOpen={isAddDialogOpen} 
            onClose={onDialogClose} 
            onSuccess={onDialogClose} 
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

      {/* Conditional Rendering based on Tab (uses viewTab prop) */}
      {booksToDisplay.length === 0 && viewTab !== 'recommendations' && viewTab !== 'to-read' ? (
        <EmptyBookshelf onAddBookClick={onAddBookClick} /> // Use the passed prop
      ) : (
        <div className="space-y-8">
          {/* Render Grid or List directly without BookshelfSection props */}
          {viewTab === 'shelf' || viewTab === 'list' ? (
            displayStyle === 'list' ? (
              <BookList 
                books={booksToDisplay} 
                onEdit={handleEdit} 
                onDelete={handleDelete}
              />
            ) : (
              <BookshelfGrid 
                books={booksToDisplay} 
                onEdit={handleEdit} 
                onDelete={handleDelete}
                onDragStart={setDraggedBook}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                draggedOverBook={draggedOverBook}
                showStatus={true} 
              />
            )
          ) : viewTab === 'to-read' ? (
             // Keep using BookshelfSection for To Read as it's a distinct section
             <BookshelfSection 
              title="To Read"
              icon={Bookmark}
              iconColor="text-orange-500"
              books={booksToDisplay}
              displayStyle={displayStyle} // Pass current display style
              onEdit={handleEdit}
              onDelete={handleDelete}
              emptyMessage="Your reading list is empty!"
              emptySubMessage="Add some books you want to read later."
            />
          ) : viewTab === 'recommendations' ? (
            // Keep using BookshelfSection for Recommendations
            <BookshelfSection 
              title="Recommendations"
              icon={LightbulbIcon}
              iconColor="text-yellow-500"
              books={booksToDisplay}
              displayStyle={displayStyle} // Pass current display style
              onEdit={handleEdit} 
              onDelete={handleDelete}
              emptyMessage="No recommendations yet."
              emptySubMessage="AI recommendations will appear here once enabled."
            />
          ) : null}
        </div>
      )}
    </div>
  );
};

export default Bookshelf;
