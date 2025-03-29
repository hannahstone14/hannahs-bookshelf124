
import React, { useState, useRef } from 'react';
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
import { BookIcon, BookMarked, Upload, Link } from 'lucide-react';
import DateReadPicker from './DateReadPicker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Create a schema for form validation
const bookFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  author: z.string().min(1, "Author is required"),
  status: z.enum(['read', 'reading', 'to-read', 'wishlist', 'recommendation']).default('read'),
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
  const [coverImageMode, setCoverImageMode] = useState<'url' | 'upload'>('url');
  const [uploadedCoverFile, setUploadedCoverFile] = useState<File | null>(null);
  const [uploadedCoverPreview, setUploadedCoverPreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const form = useForm<z.infer<typeof bookFormSchema>>({
    resolver: zodResolver(bookFormSchema),
    defaultValues: {
      title: bookToEdit?.title || '',
      author: bookToEdit?.author || '',
      status: bookToEdit?.status || 'read',
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

  const status = form.watch('status');
  const isSeries = form.watch('isSeries');
  
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedCoverFile(file);
      const imageUrl = URL.createObjectURL(file);
      setUploadedCoverPreview(imageUrl);
      // We'll handle the actual file in onSubmit
    }
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setUploadedCoverFile(file);
      const imageUrl = URL.createObjectURL(file);
      setUploadedCoverPreview(imageUrl);
    }
  };

  const onSubmit = async (data: z.infer<typeof bookFormSchema>) => {
    try {
      let finalCoverUrl = data.coverUrl || '';
      
      // If we have an uploaded file, create a data URL from it
      if (coverImageMode === 'upload' && uploadedCoverFile) {
        // For simplicity, we'll use a data URL approach
        // In a production app, you would typically upload this to a storage service
        const reader = new FileReader();
        finalCoverUrl = await new Promise((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(uploadedCoverFile);
        });
      }
      
      const bookData: Omit<Book, 'id'> = {
        title: data.title,
        author: data.author,
        coverUrl: finalCoverUrl,
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
      
      if (data.isSeries && totalSeriesBooks > 1 && totalSeriesPages > 0) {
        await addBook(bookData, totalSeriesBooks, totalSeriesPages);
      } else {
        await addBook(bookData);
      }
      
      form.reset();
      // Clean up object URLs
      if (uploadedCoverPreview) {
        URL.revokeObjectURL(uploadedCoverPreview);
        setUploadedCoverPreview('');
      }
      setUploadedCoverFile(null);
      
      if (onClose) onClose();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error adding book:', error);
    }
  };

  const handleCancel = () => {
    form.reset();
    // Clean up object URLs
    if (uploadedCoverPreview) {
      URL.revokeObjectURL(uploadedCoverPreview);
      setUploadedCoverPreview('');
    }
    setUploadedCoverFile(null);
    
    if (onClose) onClose();
  };

  const handleSeriesToggle = (checked: boolean) => {
    setShowSeriesOptions(checked);
    form.setValue('isSeries', checked);
    
    if (checked) {
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
              
              {/* Updated cover selection to allow upload or URL */}
              <div className="md:col-span-2">
                <FormLabel className="block mb-2">Book Cover</FormLabel>
                
                <Tabs defaultValue={coverImageMode} onValueChange={(value) => setCoverImageMode(value as 'url' | 'upload')}>
                  <TabsList className="mb-4">
                    <TabsTrigger value="url" className="flex items-center gap-2">
                      <Link size={16} /> URL Link
                    </TabsTrigger>
                    <TabsTrigger value="upload" className="flex items-center gap-2">
                      <Upload size={16} /> Upload Image
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="url">
                    <FormField
                      control={form.control}
                      name="coverUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input 
                              placeholder="https://example.com/cover.jpg" 
                              {...field} 
                              disabled={coverImageMode !== 'url'}
                            />
                          </FormControl>
                          <FormDescription>
                            Link to a cover image for the book
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>
                  
                  <TabsContent value="upload">
                    <div 
                      className="border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleFileInputChange}
                        className="hidden"
                      />
                      
                      {uploadedCoverPreview ? (
                        <div className="flex flex-col items-center">
                          <img 
                            src={uploadedCoverPreview} 
                            alt="Cover preview" 
                            className="w-36 h-48 object-cover rounded-md mb-2"
                          />
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setUploadedCoverFile(null);
                              setUploadedCoverPreview('');
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Upload className="h-12 w-12 text-gray-400 mb-2" />
                          <p className="text-sm text-gray-500 text-center">
                            Click to upload or drag and drop
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            JPG, PNG, GIF up to 10MB
                          </p>
                        </>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
              
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
            
            {showSeriesOptions && (
              <div className="border rounded-md p-4 space-y-4">
                <h3 className="font-medium flex items-center">
                  <BookMarked className="h-4 w-4 mr-1" /> Series Details
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
