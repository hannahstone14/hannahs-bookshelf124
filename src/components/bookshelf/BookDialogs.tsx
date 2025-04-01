
import React from 'react';
import { Book } from '@/types/book';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import AddBookForm from '../AddBookForm';

interface BookDialogsProps {
  isAddDialogOpen: boolean;
  isEditDialogOpen: boolean;
  selectedBook: Book | null;
  handleAddDialogOpenChange: (open: boolean) => void;
  handleEditDialogOpenChange: (open: boolean) => void;
  handleAddSuccess: () => void;
  handleEditSuccess: () => void;
}

const BookDialogs: React.FC<BookDialogsProps> = ({
  isAddDialogOpen,
  isEditDialogOpen,
  selectedBook,
  handleAddDialogOpenChange,
  handleEditDialogOpenChange,
  handleAddSuccess,
  handleEditSuccess
}) => {
  return (
    <>
      <Dialog open={isAddDialogOpen} onOpenChange={handleAddDialogOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogTitle>Add New Book</DialogTitle>
          <AddBookForm 
            isOpen={isAddDialogOpen} 
            onClose={() => handleAddDialogOpenChange(false)} 
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
              onClose={() => handleEditDialogOpenChange(false)}
              onSuccess={handleEditSuccess} 
              bookToEdit={selectedBook}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BookDialogs;
