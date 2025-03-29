
import React from 'react';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import AddBookForm from '@/components/AddBookForm';

interface EmptyBookshelfProps {
  onAddBook: () => void;
}

const EmptyBookshelf: React.FC<EmptyBookshelfProps> = ({ onAddBook }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 bg-gray-50 rounded-lg text-center">
      <h3 className="text-xl font-medium mb-4">Your bookshelf is empty</h3>
      <p className="text-gray-600 mb-6">Start by adding the books you've read to build your collection</p>
      <Button 
        className="bg-blue-700 hover:bg-blue-800 text-lg px-8 py-6 h-auto"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onAddBook();
        }}
      >
        <PlusCircle className="h-6 w-6 mr-2" />
        Add Your First Book
      </Button>
    </div>
  );
};

export default EmptyBookshelf;
