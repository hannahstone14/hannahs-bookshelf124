import React, { useState } from 'react';
import { useBookshelf } from '@/context/BookshelfContext';
import BookCover from './BookCover';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  PlusCircle, 
  BookOpen, 
  List, 
  BookOpenCheck, 
  BookmarkPlus, 
  ArrowDown10, 
  ArrowDownAZ, 
  ArrowDownZA, 
  Percent,
  LightbulbIcon
} from 'lucide-react';
import AddBookForm from './AddBookForm';
import { Book } from '@/types/book';
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';

type SortOption = 'title' | 'author' | 'dateRead' | 'progress';
type ViewTab = 'shelf' | 'list' | 'wishlist' | 'recommendations';
type DisplayStyle = 'shelf' | 'list';

const Bookshelf: React.FC = () => {
  const { books, recommendations, reorderBooks } = useBookshelf();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [viewTab, setViewTab] = useState<ViewTab>('shelf');
  const [displayStyle, setDisplayStyle] = useState<DisplayStyle>('shelf');
  const [draggedBook, setDraggedBook] = useState<Book | null>(null);
  const [draggedOverBook, setDraggedOverBook] = useState<Book | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('dateRead');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Get books by status
  const readingBooks = books.filter(book => book.status === 'reading');
  const toReadBooks = books.filter(book => book.status === 'to-read');
  const wishlistBooks = books.filter(book => book.status === 'wishlist');
  const completedBooks = books.filter(book => book.status === 'read');
  
  // All books for the main shelf (everything except wishlist)
  const allShelfBooks = books.filter(book => book.status !== 'wishlist');
  
  // Update both viewTab and displayStyle when changing tabs
  const handleTabChange = (value: string) => {
    const newTab = value as ViewTab;
    setViewTab(newTab);
    
    // If switching to a content tab, keep the display style
    // If switching between display styles, update it
    if (newTab === 'shelf' || newTab === 'list') {
      setDisplayStyle(newTab);
    }
  };
  
  // Sort books based on current sort option
  const getSortedBooks = (booksToSort: Book[]) => {
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
          comparison = a.dateRead.getTime() - b.dateRead.getTime();
          break;
        case 'progress':
          comparison = a.progress - b.progress;
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  };
  
  const sortedReadingBooks = getSortedBooks(readingBooks);
  const sortedAllBooks = getSortedBooks(allShelfBooks);
  const sortedWishlistBooks = getSortedBooks(wishlistBooks);
  const sortedRecommendations = getSortedBooks(recommendations);

  // Handle sorting
  const handleSort = (option: SortOption) => {
    if (sortBy === option) {
      // Toggle sort order if same option is selected
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort option and default to descending
      setSortBy(option);
      setSortOrder('desc');
    }
  };

  // Handle drag start
  const handleDragStart = (book: Book) => {
    setDraggedBook(book);
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, book: Book) => {
    e.preventDefault();
    if (draggedBook?.id !== book.id) {
      setDraggedOverBook(book);
    }
  };

  // Handle drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetBook: Book) => {
    e.preventDefault();
    
    if (!draggedBook) return;
    
    // Find indexes for reordering
    const displayBooks = viewTab === 'wishlist' ? sortedWishlistBooks : sortedAllBooks;
    const allBooks = getSortedBooks(books);
    const sourceIndex = allBooks.findIndex(book => book.id === draggedBook.id);
    const targetIndex = allBooks.findIndex(book => book.id === targetBook.id);
    
    if (sourceIndex !== -1 && targetIndex !== -1) {
      // Create a new array with the reordered books
      const newBooks = [...allBooks];
      const [movedBook] = newBooks.splice(sourceIndex, 1);
      newBooks.splice(targetIndex, 0, movedBook);
      
      // Update the order in the context
      reorderBooks(allBooks.map(b => b.id), newBooks.map(b => b.id));
    }
    
    // Reset drag state
    setDraggedBook(null);
    setDraggedOverBook(null);
  };

  // Render book item for list view
  const renderListItem = (book: Book) => {
    return (
      <div 
        key={book.id}
        className="flex items-center p-3 border-b border-gray-200 hover:bg-gray-50"
      >
        <div className="w-12 h-16 mr-4">
          {book.coverUrl ? (
            <div 
              className="w-full h-full bg-cover bg-center rounded shadow-md"
              style={{ backgroundImage: `url(${book.coverUrl})` }}
            />
          ) : (
            <div 
              className="w-full h-full flex items-center justify-center rounded shadow-md"
              style={{ backgroundColor: book.color || '#3B82F6' }}
            >
              <span className="text-white text-xs font-bold">{book.title.substring(0, 2)}</span>
            </div>
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-medium">{book.title}</h3>
          <p className="text-sm text-gray-500">{book.author}</p>
          {book.pages && (
            <p className="text-xs text-gray-400">{book.pages} pages</p>
          )}
          {book.recommendedBy && (
            <p className="text-xs text-blue-500">Recommended by: {book.recommendedBy}</p>
          )}
        </div>
        {book.status === 'reading' && (
          <div className="ml-4 text-blue-700 text-sm font-medium">
            {book.progress}% 
          </div>
        )}
      </div>
    );
  };

  // Render books in shelf view
  const renderShelfView = (booksToRender: Book[], showStatus: boolean = false) => {
    return (
      <div className="bg-gradient-to-b from-blue-50 to-transparent rounded-md p-4 relative">
        <div className="flex overflow-x-auto space-x-6 justify-start pb-4">
          {booksToRender.length > 0 ? (
            booksToRender.map(book => (
              <div 
                key={book.id}
                draggable
                onDragStart={() => handleDragStart(book)}
                onDragOver={(e) => handleDragOver(e, book)}
                onDrop={(e) => handleDrop(e, book)}
                className={`cursor-move book-container ${draggedOverBook?.id === book.id ? 'opacity-50' : ''}`}
              >
                <BookCover book={book} showStatus={showStatus} />
                {book.recommendedBy && (
                  <div className="text-xs text-center mt-1 text-blue-500 max-w-28 truncate">
                    From: {book.recommendedBy}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="w-full text-center py-6 text-gray-500">
              No books to display
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-medium">Your Digital Bookshelf</h1>
        
        <div className="flex items-center gap-3">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Book
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <AddBookForm onSuccess={() => setIsAddDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <Tabs 
          defaultValue="shelf" 
          value={viewTab} 
          onValueChange={handleTabChange}
          className="w-[540px]"
        >
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="shelf" className="data-[state=inactive]:bg-gray-200 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <BookOpen className="h-4 w-4 mr-2" />
              Shelf View
            </TabsTrigger>
            <TabsTrigger value="list" className="data-[state=inactive]:bg-gray-200 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <List className="h-4 w-4 mr-2" />
              List View
            </TabsTrigger>
            <TabsTrigger value="wishlist" className="data-[state=inactive]:bg-gray-200 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <BookmarkPlus className="h-4 w-4 mr-2" />
              Wishlist
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="data-[state=inactive]:bg-gray-200 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <LightbulbIcon className="h-4 w-4 mr-2" />
              Recommendations
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="border-blue-600 text-blue-600">
              Sort Books
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Sort by</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => handleSort('dateRead')}>
                {sortBy === 'dateRead' && (sortOrder === 'desc' ? <ArrowDown10 className="h-4 w-4 mr-2" /> : <ArrowDown10 className="h-4 w-4 mr-2 rotate-180" />)}
                By Date Read
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort('title')}>
                {sortBy === 'title' && (sortOrder === 'desc' ? <ArrowDownZA className="h-4 w-4 mr-2" /> : <ArrowDownAZ className="h-4 w-4 mr-2" />)}
                By Title
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort('author')}>
                {sortBy === 'author' && (sortOrder === 'desc' ? <ArrowDownZA className="h-4 w-4 mr-2" /> : <ArrowDownAZ className="h-4 w-4 mr-2" />)}
                By Author
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort('progress')}>
                {sortBy === 'progress' && (sortOrder === 'desc' ? <Percent className="h-4 w-4 mr-2" /> : <Percent className="h-4 w-4 mr-2 rotate-180" />)}
                By Progress
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {books.length === 0 && recommendations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-6 bg-gray-50 rounded-lg text-center">
          <h3 className="text-xl font-medium mb-4">Your bookshelf is empty</h3>
          <p className="text-gray-600 mb-6">Start by adding the books you've read to build your collection</p>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Your First Book
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <AddBookForm onSuccess={() => setIsAddDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      ) : (
        <div>
          {viewTab === 'recommendations' ? (
            <div className="space-y-4">
              <h2 className="text-xl font-medium flex items-center">
                <LightbulbIcon className="h-5 w-5 mr-2 text-yellow-500" />
                Book Recommendations From Others
              </h2>
              
              {recommendations.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-md">
                  <p className="text-gray-500">No recommendations yet</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Recommendations will appear when others add books without a verification code
                  </p>
                </div>
              ) : (
                displayStyle === 'list' ? (
                  <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="divide-y divide-gray-200">
                      {sortedRecommendations.map(book => renderListItem(book))}
                    </div>
                  </div>
                ) : (
                  renderShelfView(sortedRecommendations)
                )
              )}
            </div>
          ) : viewTab === 'wishlist' ? (
            <div className="space-y-4">
              <h2 className="text-xl font-medium flex items-center">
                <BookmarkPlus className="h-5 w-5 mr-2 text-amber-600" />
                Books You Want to Own
              </h2>
              
              {wishlistBooks.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-md">
                  <p className="text-gray-500">Your wishlist is empty</p>
                  <p className="text-sm text-gray-400 mt-2">Add books to your wishlist to keep track of books you want to buy or read later</p>
                </div>
              ) : (
                displayStyle === 'list' ? (
                  <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="divide-y divide-gray-200">
                      {sortedWishlistBooks.map(book => renderListItem(book))}
                    </div>
                  </div>
                ) : (
                  renderShelfView(sortedWishlistBooks)
                )
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Currently Reading section - always displayed first */}
              {readingBooks.length > 0 && (
                <div>
                  <h2 className="text-xl font-medium border-b border-gray-200 pb-2 mb-3 flex items-center">
                    <BookOpenCheck className="h-5 w-5 mr-2 text-blue-700" />
                    Currently Reading
                  </h2>
                  {displayStyle === 'list' ? (
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                      <div className="divide-y divide-gray-200">
                        {sortedReadingBooks.map(book => renderListItem(book))}
                      </div>
                    </div>
                  ) : (
                    renderShelfView(sortedReadingBooks)
                  )}
                </div>
              )}
              
              {/* All Books section (when not in wishlist tab) */}
              <div>
                <h2 className="text-xl font-medium border-b border-gray-200 pb-2 mb-3 flex items-center">
                  <BookOpen className="h-5 w-5 mr-2 text-green-600" />
                  Your Bookshelf
                </h2>
                {displayStyle === 'list' ? (
                  <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="divide-y divide-gray-200">
                      {sortedAllBooks.map(book => renderListItem(book))}
                    </div>
                  </div>
                ) : (
                  renderShelfView(sortedAllBooks, true)
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Bookshelf;
