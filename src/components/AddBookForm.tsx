import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, ImagePlus } from 'lucide-react';
import { useBookshelf } from '@/context/BookshelfContext';
import { cn } from '@/lib/utils';
import { Book } from '@/types/book';
import { toast } from "sonner";

interface AddBookFormProps {
  onSuccess?: () => void;
  bookToEdit?: Book;
}

const AddBookForm: React.FC<AddBookFormProps> = ({ onSuccess, bookToEdit }) => {
  const { addBook, editBook } = useBookshelf();
  const [coverPreview, setCoverPreview] = useState<string | null>(bookToEdit?.coverUrl || null);
  
  const form = useForm({
    defaultValues: {
      title: bookToEdit?.title || '',
      author: bookToEdit?.author || '',
      coverUrl: bookToEdit?.coverUrl || '',
      dateRead: bookToEdit?.dateRead || new Date(),
    }
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setCoverPreview(result);
      form.setValue('coverUrl', result);
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = (data: Omit<Book, 'id'>) => {
    if (bookToEdit) {
      editBook(bookToEdit.id, data);
    } else {
      addBook(data);
    }
    
    if (onSuccess) {
      onSuccess();
    }
    
    if (!bookToEdit) {
      form.reset({
        title: '',
        author: '',
        coverUrl: '',
        dateRead: new Date(),
      });
      setCoverPreview(null);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <h2 className="text-2xl font-serif">
          {bookToEdit ? 'Edit Book' : 'Add a New Book'}
        </h2>

        <div className="flex flex-col sm:flex-row gap-6">
          <div className="flex-1">
            <FormField
              control={form.control}
              name="title"
              rules={{ required: "Title is required" }}
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
              rules={{ required: "Author is required" }}
              render={({ field }) => (
                <FormItem className="mt-4">
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
              name="dateRead"
              render={({ field }) => (
                <FormItem className="mt-4">
                  <FormLabel>Date Read</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="w-full sm:w-40">
            <FormField
              control={form.control}
              name="coverUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Book Cover</FormLabel>
                  <FormControl>
                    <div className="flex flex-col items-center">
                      <div 
                        className={cn(
                          "w-32 h-48 border-2 border-dashed rounded-md flex items-center justify-center mb-2",
                          coverPreview ? "border-transparent" : "border-gray-300"
                        )}
                        style={coverPreview ? {
                          backgroundImage: `url(${coverPreview})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        } : {}}
                      >
                        {!coverPreview && (
                          <div className="text-center p-2">
                            <ImagePlus className="h-10 w-10 mx-auto text-muted-foreground" />
                            <p className="text-xs text-muted-foreground mt-2">Upload cover</p>
                          </div>
                        )}
                      </div>
                      <Input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="cover-upload"
                        onChange={handleImageUpload}
                      />
                      <label htmlFor="cover-upload">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => document.getElementById('cover-upload')?.click()}
                        >
                          {coverPreview ? 'Change' : 'Select Image'}
                        </Button>
                      </label>
                      <input {...field} className="hidden" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" className="bg-burgundy hover:bg-burgundy/90">
            {bookToEdit ? 'Save Changes' : 'Add to Bookshelf'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default AddBookForm;
