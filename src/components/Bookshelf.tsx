
import React, { useState } from 'react';
import { useBookshelf } from '@/context/BookshelfContext';
import BookCover from './BookCover';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PlusCircle, Grid, BookOpen, List, MoveVertical } from 'lucide-react';
import AddBookForm from './AddBookForm';
import { Book } from '@/types/book';
import { move } from '@/lib/utils';

const Bookshelf: React.FC = () => {
  const { books, reorderBooks } = useBookshelf();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [draggedBook, setDraggedBook] = useState<Book | null>(null);
  const [draggedOverBook, setDraggedOverBook] = useState<Book | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'shelf' | 'list'>('shelf');
  
  // Filter books by status
  const readBooks = books.filter(book => book.status === 'read' || !book.status);
  const currentlyReading = books.filter(book => book.status === 'reading');
  
  // Sort read books by date (newest first)
  const sortedReadBooks = [...readBooks].sort((a, b) => 
    b.dateRead.getTime() - a.dateRead.getTime()
  );

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
  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetBook: Book, groupBooks: Book[]) => {
    e.preventDefault();
    
    if (!draggedBook) return;
    
    // Find indexes for reordering
    const sourceIndex = groupBooks.findIndex(book => book.id === draggedBook.id);
    const targetIndex = groupBooks.findIndex(book => book.id === targetBook.id);
    
    if (sourceIndex !== -1 && targetIndex !== -1) {
      // Create a new array with the reordered books
      const newBooks = [...groupBooks];
      const [movedBook] = newBooks.splice(sourceIndex, 1);
      newBooks.splice(targetIndex, 0, movedBook);
      
      // Update the order in the context
      reorderBooks(groupBooks.map(b => b.id), newBooks.map(b => b.id));
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
        </div>
        {book.status === 'reading' && (
          <div className="ml-4 text-blue-600 text-sm font-medium">
            {book.progress}% 
          </div>
        )}
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
              <Button>
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
        <div className="flex items-center gap-2">
          <Button 
            variant={viewMode === 'grid' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setViewMode('grid')}
            className="rounded-l-md rounded-r-none"
          >
            <Grid className="h-4 w-4 mr-2" />
            Grid View
          </Button>
          <Button 
            variant={viewMode === 'shelf' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setViewMode('shelf')}
            className="rounded-l-none rounded-r-none"
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Shelf View
          </Button>
          <Button 
            variant={viewMode === 'list' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setViewMode('list')}
            className="rounded-l-none rounded-r-md"
          >
            <List className="h-4 w-4 mr-2" />
            List View
          </Button>
        </div>
        <Button variant="ghost" size="sm">
          <MoveVertical className="h-4 w-4 mr-2" />
          Reorder Books
        </Button>
      </div>

      {books.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-6 bg-gray-50 rounded-lg text-center">
          <h3 className="text-xl font-medium mb-4">Your bookshelf is empty</h3>
          <p className="text-gray-600 mb-6">Start by adding the books you've read to build your collection</p>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
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
        <div className="space-y-10">
          {/* List View */}
          {viewMode === 'list' && (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 font-medium">
                All Books
              </div>
              <div className="divide-y divide-gray-200">
                {currentlyReading.map(book => renderListItem(book))}
                {sortedReadBooks.map(book => renderListItem(book))}
              </div>
            </div>
          )}
          
          {/* Grid/Shelf View */}
          {viewMode !== 'list' && (
            <div className="space-y-2">
              {/* Show currently reading section if there are books being read */}
              {currentlyReading.length > 0 && (
                <div className="space-y-2">
                  <h2 className="text-xl font-medium border-b border-gray-200 pb-2 mb-3">
                    Currently Reading
                  </h2>
                  <div className="modern-bookshelf p-4 relative">
                    <div className="absolute left-0 right-0 bottom-0 h-0.5 bg-gray-300"></div>
                    <div className={`flex ${viewMode === 'grid' ? 'flex-wrap gap-6' : 'overflow-x-auto space-x-6'} justify-start`}>
                      {currentlyReading.map(book => (
                        <div 
                          key={book.id}
                          draggable
                          onDragStart={() => handleDragStart(book)}
                          onDragOver={(e) => handleDragOver(e, book)}
                          onDrop={(e) => handleDrop(e, book, currentlyReading)}
                          className={`cursor-move ${draggedOverBook?.id === book.id ? 'opacity-50' : ''}`}
                        >
                          <BookCover book={book} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {/* All books on one shelf */}
              <div className="space-y-2">
                <h2 className="text-xl font-medium border-b border-gray-200 pb-2 mb-3">
                  Your Bookshelf
                </h2>
                <div className="enhanced-bookshelf p-4 relative">
                  <div className={`flex ${viewMode === 'grid' ? 'flex-wrap gap-6' : 'overflow-x-auto space-x-6'} justify-start pb-4`}>
                    {sortedReadBooks.map(book => (
                      <div 
                        key={book.id}
                        draggable
                        onDragStart={() => handleDragStart(book)}
                        onDragOver={(e) => handleDragOver(e, book)}
                        onDrop={(e) => handleDrop(e, book, sortedReadBooks)}
                        className={`cursor-move ${draggedOverBook?.id === book.id ? 'opacity-50' : ''}`}
                      >
                        <BookCover book={book} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Bookshelf;
