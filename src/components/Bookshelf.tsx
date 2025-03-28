import React, { useState, useEffect } from 'react';
import { useBookshelf } from '@/context/BookshelfContext';
import BookCover from './BookCover';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  PlusCircle, 
  BookOpen, 
  List, 
  BookOpenCheck, 
  Bookmark, 
  ArrowDown10, 
  ArrowDownAZ, 
  ArrowDownZA, 
  Percent,
  LightbulbIcon,
  Star,
  MoreVertical,
  Pencil,
  Trash2
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

type SortOption = 'title' | 'author' | 'dateRead' | 'progress' | 'favorite';
type ViewTab = 'shelf' | 'list' | 'to-read' | 'recommendations';
type DisplayStyle = 'shelf' | 'list';

const Bookshelf: React.FC = () => {
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
  
  const readingBooks = books.filter(book => book.status === 'reading');
  const toReadBooks = books.filter(book => book.status === 'to-read');
  const completedBooks = books.filter(book => book.status === 'read');
  
  const allShelfBooks = books.filter(book => book.status !== 'to-read');
  
  useEffect(() => {
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
  }, [viewTab, sortBy, sortOrder, books, recommendations, toReadBooks, allShelfBooks]);

  const handleTabChange = (value: string) => {
    const newTab = value as ViewTab;
    setViewTab(newTab);
    
    if (newTab === 'shelf' || newTab === 'list') {
      setDisplayStyle(newTab);
    }
  };
  
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
          if (!a.dateRead) return sortOrder === 'asc' ? -1 : 1;
          if (!b.dateRead) return sortOrder === 'asc' ? 1 : -1;
          comparison = a.dateRead.getTime() - b.dateRead.getTime();
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
  };
  
  const sortedReadingBooks = getSortedBooks(readingBooks);

  const handleSort = (option: SortOption) => {
    if (sortBy === option) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(option);
      setSortOrder('desc');
    }
  };

  const handleDragStart = (book: Book) => {
    setDraggedBook(book);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, book: Book) => {
    e.preventDefault();
    if (draggedBook?.id !== book.id) {
      setDraggedOverBook(book);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetBook: Book) => {
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
  };

  const handleEdit = (book: Book) => {
    setSelectedBook(book);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (bookId: string) => {
    removeBook(bookId);
  };

  const renderListItem = (book: Book) => {
    return (
      <div 
        key={book.id}
        className="flex items-center p-3 border-b border-gray-200 hover:bg-gray-50"
      >
        <div className="w-12 h-16 mr-4 relative">
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
          {book.favorite && (
            <div className="absolute -top-1 -right-1">
              <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-medium">{book.title}</h3>
          <p className="text-sm text-gray-500">{book.author}</p>
          {book.pages && (
            <p className="text-xs text-gray-400">{book.pages} pages</p>
          )}
          {book.genres && book.genres.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {book.genres.slice(0, 2).map(genre => (
                <span key={genre} className="text-xs bg-blue-50 text-blue-600 rounded px-1.5 py-0.5">
                  {genre}
                </span>
              ))}
              {book.genres.length > 2 && (
                <span className="text-xs bg-gray-50 text-gray-600 rounded px-1.5 py-0.5">
                  +{book.genres.length - 2}
                </span>
              )}
            </div>
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
        <div className="ml-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-white">
              <DropdownMenuItem onClick={() => handleEdit(book)}>
                <Pencil className="h-4 w-4 mr-2" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDelete(book.id)}>
                <Trash2 className="h-4 w-4 mr-2" /> Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  };

  const renderShelfView = (booksToRender: Book[], showStatus: boolean = false) => {
    return (
      <div className="bg-gradient-to-b from-blue-50 to-transparent rounded-md p-4 relative">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {booksToRender.length > 0 ? (
            booksToRender.map(book => (
              <div 
                key={book.id}
                draggable
                onDragStart={() => handleDragStart(book)}
                onDragOver={(e) => handleDragOver(e, book)}
                onDrop={(e) => handleDrop(e, book)}
                className={`cursor-move book-container relative group ${draggedOverBook?.id === book.id ? 'opacity-50' : ''}`}
              >
                <div className="absolute right-1 top-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="h-7 w-7 bg-white">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 bg-white">
                      <DropdownMenuItem onClick={() => handleEdit(book)}>
                        <Pencil className="h-4 w-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(book.id)}>
                        <Trash2 className="h-4 w-4 mr-2" /> Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <BookCover book={book} showStatus={showStatus} />
                {book.recommendedBy && (
                  <div className="text-xs text-center mt-1 text-blue-500 max-w-28 truncate">
                    From: {book.recommendedBy}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-6 text-gray-500">
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
        <h1 className="text-3xl font-medium">Hannah's Library</h1>
        
        <div className="flex items-center gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                className="bg-blue-700 hover:bg-blue-800 text-lg px-8 py-6 h-auto"
                onClick={() => setIsAddDialogOpen(true)}
              >
                <PlusCircle className="h-6 w-6 mr-2" />
                Add Book
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogTitle>Add New Book</DialogTitle>
              <AddBookForm onSuccess={() => setIsAddDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogTitle>Edit Book</DialogTitle>
          {selectedBook && (
            <AddBookForm 
              onSuccess={() => setIsEditDialogOpen(false)} 
              bookToEdit={selectedBook}
            />
          )}
        </DialogContent>
      </Dialog>

      <div className="flex justify-between items-center mb-6">
        <Tabs 
          defaultValue="shelf" 
          value={viewTab} 
          onValueChange={handleTabChange}
          className="w-[540px]"
        >
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="shelf" className="data-[state=inactive]:bg-gray-200 data-[state=active]:bg-blue-700 data-[state=active]:text-white">
              <BookOpen className="h-4 w-4 mr-2" />
              Shelf View
            </TabsTrigger>
            <TabsTrigger value="list" className="data-[state=inactive]:bg-gray-200 data-[state=active]:bg-blue-700 data-[state=active]:text-white">
              <List className="h-4 w-4 mr-2" />
              List View
            </TabsTrigger>
            <TabsTrigger value="to-read" className="data-[state=inactive]:bg-gray-200 data-[state=active]:bg-blue-700 data-[state=active]:text-white">
              <Bookmark className="h-4 w-4 mr-2" />
              To Read
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="data-[state=inactive]:bg-gray-200 data-[state=active]:bg-blue-700 data-[state=active]:text-white">
              <LightbulbIcon className="h-4 w-4 mr-2" />
              Recommendations
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="border-blue-700 text-blue-700"
              onClick={(e) => e.preventDefault()}
            >
              Sort Books
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-white z-50">
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
              <DropdownMenuItem onClick={() => handleSort('favorite')}>
                {sortBy === 'favorite' && (sortOrder === 'desc' ? <Star className="h-4 w-4 mr-2" /> : <Star className="h-4 w-4 mr-2 opacity-50" />)}
                Favorites First
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {books.length === 0 && recommendations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-6 bg-gray-50 rounded-lg text-center">
          <h3 className="text-xl font-medium mb-4">Your bookshelf is empty</h3>
          <p className="text-gray-600 mb-6">Start by adding the books you've read to build your collection</p>
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                className="bg-blue-700 hover:bg-blue-800 text-lg px-8 py-6 h-auto"
                onClick={() => setIsAddDialogOpen(true)}
              >
                <PlusCircle className="h-6 w-6 mr-2" />
                Add Your First Book
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogTitle>Add Your First Book</DialogTitle>
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
                      {booksToDisplay.map(book => renderListItem(book))}
                    </div>
                  </div>
                ) : (
                  renderShelfView(booksToDisplay)
                )
              )}
            </div>
          ) : viewTab === 'to-read' ? (
            <div className="space-y-4">
              <h2 className="text-xl font-medium flex items-center">
                <Bookmark className="h-5 w-5 mr-2 text-amber-600" />
                Books To Read
              </h2>
              
              {toReadBooks.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-md">
                  <p className="text-gray-500">Your To Read list is empty</p>
                  <p className="text-sm text-gray-400 mt-2">Add books you want to read next</p>
                </div>
              ) : (
                displayStyle === 'list' ? (
                  <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="divide-y divide-gray-200">
                      {booksToDisplay.map(book => renderListItem(book))}
                    </div>
                  </div>
                ) : (
                  renderShelfView(booksToDisplay)
                )
              )}
            </div>
          ) : (
            <div className="space-y-6">
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
              
              <div>
                <h2 className="text-xl font-medium border-b border-gray-200 pb-2 mb-3 flex items-center">
                  <BookOpen className="h-5 w-5 mr-2 text-green-600" />
                  Bookshelf
                </h2>
                {displayStyle === 'list' ? (
                  <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="divide-y divide-gray-200">
                      {booksToDisplay.map(book => renderListItem(book))}
                    </div>
                  </div>
                ) : (
                  renderShelfView(booksToDisplay, true)
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
