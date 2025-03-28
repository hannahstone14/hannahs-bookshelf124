
import React from 'react';
import { useBookshelf } from '@/context/BookshelfContext';
import BookCover from './BookCover';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import AddBookForm from './AddBookForm';
import { Book } from '@/types/book';

const Bookshelf: React.FC = () => {
  const { books } = useBookshelf();
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);

  // Group books by month and year
  const groupedBooks = React.useMemo(() => {
    // Filter to only show read books for the chronological bookshelf
    const readBooks = books.filter(book => book.status === 'read' || !book.status);
    
    const groups: { [key: string]: Book[] } = {};
    
    readBooks.forEach(book => {
      const date = book.dateRead;
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      
      if (!groups[key]) {
        groups[key] = [];
      }
      
      groups[key].push(book);
    });
    
    // Sort the keys in reverse chronological order
    return Object.keys(groups)
      .sort((a, b) => b.localeCompare(a))
      .map(key => {
        const [year, month] = key.split('-').map(Number);
        return {
          label: new Date(year, month).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long' 
          }),
          books: groups[key]
        };
      });
  }, [books]);

  // Extract currently reading books
  const currentlyReading = React.useMemo(() => {
    return books.filter(book => book.status === 'reading');
  }, [books]);

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl md:text-4xl font-serif">My Bookshelf</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-burgundy hover:bg-burgundy/90">
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Book
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <AddBookForm onSuccess={() => setIsAddDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {books.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-6 bg-gray-50 rounded-lg text-center">
          <h3 className="text-xl font-serif mb-4">Your bookshelf is empty</h3>
          <p className="text-gray-600 mb-6">Start by adding the books you've read to build your collection</p>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-burgundy hover:bg-burgundy/90">
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
          {/* Show currently reading section if there are books being read */}
          {currentlyReading.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-xl font-serif border-b border-bookshelf-medium pb-2 mb-3">
                Currently Reading
              </h2>
              <div className="bookshelf rounded-md p-4 relative">
                <div className="bookshelf-divider absolute left-0 right-0 bottom-0 h-3 rounded-b-md"></div>
                <div className="flex flex-wrap gap-6 justify-start">
                  {currentlyReading.map(book => (
                    <BookCover key={book.id} book={book} />
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Show chronological bookshelf for read books */}
          {groupedBooks.map((group) => (
            <div key={group.label} className="space-y-2">
              <h2 className="text-xl font-serif border-b border-bookshelf-medium pb-2 mb-3">
                {group.label}
              </h2>
              <div className="bookshelf rounded-md p-4 relative">
                <div className="bookshelf-divider absolute left-0 right-0 bottom-0 h-3 rounded-b-md"></div>
                <div className="flex flex-wrap gap-6 justify-start">
                  {group.books.map(book => (
                    <BookCover key={book.id} book={book} />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Bookshelf;
