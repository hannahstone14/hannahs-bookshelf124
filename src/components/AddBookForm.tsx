
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Book } from '@/types/book';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useBookshelf } from '@/context/BookshelfContext';
import { BookIcon, BookMarked } from 'lucide-react';
import DateReadPicker from './DateReadPicker';

// Create a schema for form validation
const bookFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  author: z.string().min(1, "Author is required"),
  status: z.enum(['read', 'reading', 'to-read']),
  dateRead: z.date().optional(),
  pages: z.number().int().min(1, "Pages is required").max(10000, "Too many pages").optional(),
  progress: z.number().int().min(0, "Progress must be at least 0").max(100, "Progress can't exceed 100%").default(0),
  coverUrl: z.string().url("Must be a valid URL").optional().or(z.literal('')),
  genres: z.array(z.string()).optional(),
  recommendedBy: z.string().optional(),
  isSeries: z.boolean().default(false),
  seriesName: z.string().optional(),
  seriesPosition: z.number().int().min(1, "Series position must be at least 1").optional(),
});

interface AddBookFormProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
  bookToEdit?: Book;
}

const AddBookForm: React.FC<AddBookFormProps> = ({ isOpen, onClose, onSuccess, bookToEdit }) => {
  const { addBook } = useBookshelf();
  const [showSeriesOptions, setShowSeriesOptions] = useState(bookToEdit?.isSeries || false);
  const [totalSeriesBooks, setTotalSeriesBooks] = useState<number>(0);
  const [totalSeriesPages, setTotalSeriesPages] = useState<number>(0);
  
  const form = useForm<z.infer<typeof bookFormSchema>>({
    resolver: zodResolver(bookFormSchema),
    defaultValues: {
      title: bookToEdit?.title || '',
      author: bookToEdit?.author || '',
      status: bookToEdit?.status || 'to-read',
      progress: bookToEdit?.progress || 0,
      coverUrl: bookToEdit?.coverUrl || '',
      pages: bookToEdit?.pages || undefined,
      genres: bookToEdit?.genres || [],
      recommendedBy: bookToEdit?.recommendedBy || '',
      isSeries: bookToEdit?.isSeries || false,
      seriesName: bookToEdit?.seriesName || '',
      seriesPosition: bookToEdit?.seriesPosition || 1,
      dateRead: bookToEdit?.dateRead || undefined,
    },
  });

  // Watch for values that might affect the form
  const status = form.watch('status');
  const isSeries = form.watch('isSeries');
  
  const onSubmit = async (data: z.infer<typeof bookFormSchema>) => {
    try {
      // Prepare the book data
      const bookData: Omit<Book, 'id'> = {
        title: data.title,
        author: data.author,
        coverUrl: data.coverUrl || '',
        status: data.status,
        progress: data.progress,
        pages: data.pages || 0,
        dateRead: data.dateRead || new Date(),
        genres: data.genres || [],
        recommendedBy: data.recommendedBy || '',
        favorite: bookToEdit?.favorite || false,
        isSeries: data.isSeries,
        seriesName: data.isSeries ? (data.seriesName || data.title) : undefined,
        seriesPosition: data.isSeries ? data.seriesPosition : undefined,
      };
      
      // If it's part of a series and we have total books, add all books in the series
      if (data.isSeries && totalSeriesBooks > 1 && totalSeriesPages > 0) {
        await addBook(bookData, totalSeriesBooks, totalSeriesPages);
      } else {
        await addBook(bookData);
      }
      
      // Reset form and close dialog
      form.reset();
      if (onClose) onClose();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error adding book:', error);
    }
  };

  // Handle form cancel
  const handleCancel = () => {
    form.reset();
    if (onClose) onClose();
  };

  // Toggling series options
  const handleSeriesToggle = (checked: boolean) => {
    setShowSeriesOptions(checked);
    form.setValue('isSeries', checked);
    
    if (checked) {
      // Auto-populate series name with title if empty
      const currentTitle = form.getValues('title');
      if (currentTitle && !form.getValues('seriesName')) {
        form.setValue('seriesName', currentTitle);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="sm:max-w-md md:max-w-xl overflow-y-auto max-h-screen">
        <DialogHeader>
          <DialogTitle>{bookToEdit ? 'Edit Book' : 'Add a New Book'}</DialogTitle>
          <DialogDescription>
            Enter the details of the book you want to {bookToEdit ? 'update' : 'add to your shelf'}.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Book Title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Author */}
              <FormField
                control={form.control}
                name="author"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Author</FormLabel>
                    <FormControl>
                      <Input placeholder="Author Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel>Status</FormLabel>
                    <div className="flex space-x-2">
                      <Button
                        type="button"
                        variant={field.value === 'to-read' ? 'default' : 'outline'}
                        className="flex-1"
                        onClick={() => field.onChange('to-read')}
                      >
                        To Read
                      </Button>
                      <Button
                        type="button"
                        variant={field.value === 'reading' ? 'default' : 'outline'}
                        className="flex-1"
                        onClick={() => field.onChange('reading')}
                      >
                        Reading
                      </Button>
                      <Button
                        type="button"
                        variant={field.value === 'read' ? 'default' : 'outline'}
                        className="flex-1"
                        onClick={() => field.onChange('read')}
                      >
                        Read
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Date Read - Only show for 'read' status */}
              {status === 'read' && (
                <FormField
                  control={form.control}
                  name="dateRead"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date Read</FormLabel>
                      <DateReadPicker 
                        date={field.value} 
                        onDateChange={(date) => field.onChange(date)} 
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              {/* Pages */}
              <FormField
                control={form.control}
                name="pages"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pages</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Number of pages" 
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Progress - Only show for 'reading' status */}
              {status === 'reading' && (
                <FormField
                  control={form.control}
                  name="progress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Progress (%)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Reading progress" 
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              {/* Cover URL */}
              <FormField
                control={form.control}
                name="coverUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cover URL (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/cover.jpg" {...field} />
                    </FormControl>
                    <FormDescription>
                      Link to a cover image for the book
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Recommended By */}
              <FormField
                control={form.control}
                name="recommendedBy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recommended By (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Friend's name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Series Checkbox */}
            <FormField
              control={form.control}
              name="isSeries"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        if (typeof checked === 'boolean') {
                          handleSeriesToggle(checked);
                        }
                      }}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="flex items-center">
                      <BookMarked className="h-4 w-4 mr-1" /> This book is part of a series
                    </FormLabel>
                    <FormDescription>
                      Add series details to group books together
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            
            {/* Series Options */}
            {showSeriesOptions && (
              <div className="border rounded-md p-4 space-y-4">
                <h3 className="font-medium flex items-center">
                  <BookMarked className="h-4 w-4 mr-1" /> Series Details
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Series Name */}
                  <FormField
                    control={form.control}
                    name="seriesName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Series Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Series Name" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Series Position */}
                  <FormField
                    control={form.control}
                    name="seriesPosition"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Book # in Series</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="1" 
                            min="1"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 1)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Total Books in Series */}
                  <FormItem>
                    <FormLabel>Total Books in Series</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Total books"
                        min="1"
                        value={totalSeriesBooks || ''}
                        onChange={(e) => setTotalSeriesBooks(e.target.value ? parseInt(e.target.value) : 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter to add all books at once
                    </FormDescription>
                  </FormItem>
                  
                  {/* Total Pages in Series */}
                  {totalSeriesBooks > 1 && (
                    <FormItem>
                      <FormLabel>Total Pages in Series</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Total pages"
                          min="1"
                          value={totalSeriesPages || ''}
                          onChange={(e) => setTotalSeriesPages(e.target.value ? parseInt(e.target.value) : 0)}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                </div>
                
                {totalSeriesBooks > 1 && (
                  <p className="text-sm text-muted-foreground">
                    This will create {totalSeriesBooks} books in the series with approximately {Math.floor(totalSeriesPages / totalSeriesBooks)} pages each.
                  </p>
                )}
              </div>
            )}
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="submit">{bookToEdit ? 'Update' : 'Add'} Book</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddBookForm;
