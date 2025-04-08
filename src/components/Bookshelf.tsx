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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { 
  List, 
  BookOpen as BookOpenIcon, 
  Bookmark as BookmarkIcon, 
  ArrowDown10, 
  ArrowDownAZ, 
  ArrowDownZA, 
  Percent,
  Star,
  ArrowUpDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import BookDetailsModal from './BookDetailsModal';

// Define types locally again
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
}

const Bookshelf: React.FC<BookshelfProps> = ({ 
  isAddDialogOpen, 
  onDialogClose, 
  onAddBookClick 
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
  
  // State for Details Modal
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedBookForDetails, setSelectedBookForDetails] = useState<Book | null>(null);
  
  // Add state back
  const [viewTab, setViewTab] = useState<ViewTab>('shelf');
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

  // Use local state for sorting
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
  
  // Use local state in useEffect
  useEffect(() => {
    if (!isMounted.current) return;
    
    let displayedBooks: Book[] = [];
    
    switch(viewTab) { // Use viewTab from local state
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
  }, [viewTab, sortBy, sortOrder, books, recommendations, getSortedBooks, allShelfBooks, toReadBooks]); // Depend on local state

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

  // Add handlers back
  const handleTabChange = useCallback((value: string) => {
    const newTab = value as ViewTab;
    setViewTab(newTab);
  }, []);

  const handleSort = useCallback((option: SortOption) => {
    if (sortBy === option) {
      setSortOrder(currentOrder => (currentOrder === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(option);
      setSortOrder('desc'); 
    }
  }, [sortBy]);

  // Handler to open Details Modal
  const handleShowDetails = (book: Book) => {
    setSelectedBookForDetails(book);
    setIsDetailsModalOpen(true);
  };

  // Handler to close Details Modal
  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    // Delay clearing the selected book to allow modal fade-out animation
    setTimeout(() => setSelectedBookForDetails(null), 300); 
  };

  // Handler to trigger edit from Details Modal
  const handleEditFromDetails = () => {
    if (selectedBookForDetails) {
      handleEdit(selectedBookForDetails); // Use existing handleEdit
    }
    handleCloseDetailsModal(); // Close details modal
  };

  // Modified onAddBookClick handler to check authentication
  const handleAddBookClick = () => {
    if (!isAllowedUser) {
      alert('You need to log in to add books.');
      console.log("User not authorized. Redirecting to login...");
      navigate('/login');
      return;
    }
    onAddBookClick();
  };

  return (
    <div className="space-y-8">
       {/* Controls Row: Tabs, Sort, Add Button */}
       <div className="flex justify-between items-center mb-6 gap-4"> { /* Use justify-between and gap */ }
          {/* Wrapper for Tabs and Sort */}
          <div className="flex items-center gap-4 flex-grow"> { /* Allow this section to grow */ }
            {/* Tabs */} 
            <Tabs value={viewTab} onValueChange={handleTabChange} className="hidden sm:block"> 
              <TabsList className="bg-gray-100 p-1 rounded-lg h-10"> { /* Match height with buttons */ }
                <TabsTrigger value="shelf" className={cn("px-3 text-sm", viewTab === 'shelf' ? 'bg-white shadow-sm rounded-md text-gray-900' : 'text-gray-600')}><BookOpenIcon className="h-4 w-4 mr-1.5"/>Shelf</TabsTrigger>
                <TabsTrigger value="list" className={cn("px-3 text-sm", viewTab === 'list' ? 'bg-white shadow-sm rounded-md text-gray-900' : 'text-gray-600')}><List className="h-4 w-4 mr-1.5"/>List</TabsTrigger>
                <TabsTrigger value="to-read" className={cn("px-3 text-sm", viewTab === 'to-read' ? 'bg-white shadow-sm rounded-md text-gray-900' : 'text-gray-600')}><BookmarkIcon className="h-4 w-4 mr-1.5"/>To Read</TabsTrigger>
                <TabsTrigger value="recommendations" className={cn("px-3 text-sm", viewTab === 'recommendations' ? 'bg-white shadow-sm rounded-md text-gray-900' : 'text-gray-600')}><LightbulbIcon className="h-4 w-4 mr-1.5"/>Recs</TabsTrigger>
              </TabsList>
            </Tabs>
            {/* Sort Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="border-gray-300 text-gray-600 h-10 w-10"> { /* Match height */ }
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-white z-50">
                 <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => handleSort('dateRead')} className="text-sm">
                    {sortBy === 'dateRead' && (sortOrder === 'desc' ? <ArrowDown10 className="h-4 w-4 mr-2" /> : <ArrowDown10 className="h-4 w-4 mr-2 rotate-180" />)}
                    Date Read
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSort('title')} className="text-sm">
                    {sortBy === 'title' && (sortOrder === 'desc' ? <ArrowDownZA className="h-4 w-4 mr-2" /> : <ArrowDownAZ className="h-4 w-4 mr-2" />)}
                    Title
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSort('author')} className="text-sm">
                    {sortBy === 'author' && (sortOrder === 'desc' ? <ArrowDownZA className="h-4 w-4 mr-2" /> : <ArrowDownAZ className="h-4 w-4 mr-2" />)}
                    Author
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSort('progress')} className="text-sm">
                    {sortBy === 'progress' && (sortOrder === 'desc' ? <Percent className="h-4 w-4 mr-2" /> : <Percent className="h-4 w-4 mr-2 rotate-180" />)}
                    Progress
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSort('favorite')} className="text-sm">
                    {sortBy === 'favorite' && (sortOrder === 'desc' ? <Star className="h-4 w-4 mr-2" /> : <Star className="h-4 w-4 mr-2 opacity-50" />)}
                    Favorites First
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {/* Existing Black Add Book Button (Update color) */} 
          <Button 
            className="bg-[#219ebc] hover:bg-[#1a7f9c] text-white text-sm px-4 py-2 rounded-md h-10 flex-shrink-0"
            id="add-book-button"
            onClick={handleAddBookClick} 
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

     {/* Details Modal (NEW) */}
     <BookDetailsModal 
       book={selectedBookForDetails} 
       isOpen={isDetailsModalOpen} 
       onClose={handleCloseDetailsModal} 
       onEdit={handleEditFromDetails} 
     />

     {/* Conditional Rendering based on Tab (uses local viewTab state) */}
     {booksToDisplay.length === 0 && viewTab !== 'recommendations' && viewTab !== 'to-read' ? (
       <EmptyBookshelf onAddBookClick={handleAddBookClick} />
     ) : (
        <div className="space-y-8">
          {/* Render Grid or List directly without BookshelfSection props */}
          {viewTab === 'shelf' || viewTab === 'list' ? (
            displayStyle === 'list' ? (
              <BookList 
                books={booksToDisplay} 
                onEdit={handleEdit} 
                onDelete={handleDelete}
                onShowDetails={handleShowDetails}
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
                onShowDetails={handleShowDetails}
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
              onShowDetails={handleShowDetails}
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
              onShowDetails={handleShowDetails}
            />
          ) : null}
        </div>
     )}
    </div>
  );
};

export default Bookshelf;
