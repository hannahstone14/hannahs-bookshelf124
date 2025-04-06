import React from 'react';
import { PlusCircle, BookOpenCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import AddBookForm from '@/components/AddBookForm';

interface EmptyBookshelfProps {
  onAddBookClick: () => void;
}

const EmptyBookshelf: React.FC<EmptyBookshelfProps> = ({ onAddBookClick }) => {
  return (
    <div className="text-center py-16 px-4 bg-white border border-gray-200 rounded-lg shadow-sm">
      <BookOpenCheck className="mx-auto h-12 w-12 text-gray-400 mb-4" />
      <h3 className="text-lg font-semibold text-gray-800 mb-2">Your Bookshelf is Empty</h3>
      <p className="text-sm text-gray-500 mb-6">
        Looks like you haven't added any books yet. Get started by adding your first book!
      </p>
      <Button 
        onClick={onAddBookClick} 
        className="bg-gray-900 hover:bg-gray-700 text-white text-sm px-4 py-2 rounded-md"
      >
        <PlusCircle className="h-4 w-4 mr-2" />
        Add Your First Book
      </Button>
    </div>
  );
};

export default EmptyBookshelf;
