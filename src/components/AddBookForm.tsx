
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
import { CalendarIcon, ImagePlus, BookOpen, ShieldAlert, Star } from 'lucide-react';
import { useBookshelf } from '@/context/BookshelfContext';
import { cn } from '@/lib/utils';
import { Book } from '@/types/book';
import { toast } from "sonner";
import { Slider } from '@/components/ui/slider';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

interface AddBookFormProps {
  onSuccess?: () => void;
  bookToEdit?: Book;
}

const presetGenres = [
  'Fiction',
  'Non-Fiction',
  'Science Fiction',
  'Fantasy',
  'Mystery',
  'Biography',
  'History',
  'Romance',
  'Self-Help',
  'Poetry',
  'Thriller',
  'Horror',
  'Adventure',
  'Young Adult',
  'Children',
  'Memoir',
  'Philosophy',
  'Psychology',
  'Science',
  'Art'
];

const AddBookForm: React.FC<AddBookFormProps> = ({ onSuccess, bookToEdit }) => {
  const { addBook, editBook } = useBookshelf();
  const [coverPreview, setCoverPreview] = useState<string | null>(bookToEdit?.coverUrl || null);
  const [readingProgress, setReadingProgress] = useState<number>(bookToEdit?.progress || 0);
  const [readingStatus, setReadingStatus] = useState<'to-read' | 'reading' | 'read' | 'wishlist'>(
    bookToEdit?.status as any || 'to-read'
  );
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [showRecommenderInput, setShowRecommenderInput] = useState<boolean>(false);
  const [recommenderName, setRecommenderName] = useState<string>('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>(bookToEdit?.genres || []);
  const [newGenre, setNewGenre] = useState<string>('');
  const [isFavorite, setIsFavorite] = useState<boolean>(bookToEdit?.favorite || false);
  
  const form = useForm({
    defaultValues: {
      title: bookToEdit?.title || '',
      author: bookToEdit?.author || '',
      coverUrl: bookToEdit?.coverUrl || '',
      dateRead: bookToEdit?.dateRead || new Date(),
      genres: bookToEdit?.genres || [],
      status: bookToEdit?.status || 'to-read',
      progress: bookToEdit?.progress || 0,
      pages: bookToEdit?.pages || 0,
      favorite: bookToEdit?.favorite || false
    }
  });

  // Update status based on progress
  const handleProgressChange = (value: number[]) => {
    const progress = value[0];
    setReadingProgress(progress);
    
    // Automatically update the reading status based on progress
    if (progress === 100) {
      setReadingStatus('read');
    } else if (progress > 0) {
      setReadingStatus('reading');
    } else {
      setReadingStatus('to-read');
    }
  };

  // Handle status change
  const handleStatusChange = (status: 'to-read' | 'reading' | 'read' | 'wishlist') => {
    setReadingStatus(status);
    
    // Automatically update progress based on status
    if (status === 'read') {
      setReadingProgress(100);
    } else if (status === 'to-read') {
      setReadingProgress(0);
    }
  };

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

  const handleVerification = () => {
    if (verificationCode !== 'book') {
      setShowRecommenderInput(true);
      return false;
    }
    return true;
  };

  const addGenre = (genre: string) => {
    if (!genre || selectedGenres.includes(genre)) return;
    setSelectedGenres([...selectedGenres, genre]);
    setNewGenre('');
  };

  const removeGenre = (genre: string) => {
    setSelectedGenres(selectedGenres.filter(g => g !== genre));
  };

  const toggleGenre = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      removeGenre(genre);
    } else {
      addGenre(genre);
    }
  };

  const onSubmit = (data: any) => {
    // If editing an existing book, skip verification
    if (!bookToEdit) {
      // For new books, verify the code
      const isVerified = handleVerification();
      
      if (!isVerified) {
        if (!recommenderName) {
          toast.error('Please enter your name to recommend this book');
          return;
        }
        
        // Add as recommendation
        const bookData = {
          ...data,
          status: 'recommendation',
          progress: 0,
          pages: parseInt(data.pages) || 0,
          recommendedBy: recommenderName,
          genres: selectedGenres,
          favorite: false
        };
        
        addBook(bookData);
        toast.success('Thank you for your recommendation!');
        
        if (onSuccess) {
          onSuccess();
        }
        
        resetForm();
        return;
      }
    }
    
    // Regular book addition or edit
    const bookData = {
      ...data,
      status: readingStatus,
      progress: readingProgress,
      pages: parseInt(data.pages) || 0,
      genres: selectedGenres,
      favorite: isFavorite
    };
    
    if (bookToEdit) {
      editBook(bookToEdit.id, bookData);
    } else {
      addBook(bookData);
    }
    
    if (onSuccess) {
      onSuccess();
    }
    
    if (!bookToEdit) {
      resetForm();
    }
  };

  const resetForm = () => {
    form.reset({
      title: '',
      author: '',
      coverUrl: '',
      dateRead: new Date(),
      genres: [],
      status: 'to-read',
      progress: 0,
      pages: 0,
      favorite: false
    });
    setCoverPreview(null);
    setReadingProgress(0);
    setReadingStatus('to-read');
    setVerificationCode('');
    setShowRecommenderInput(false);
    setRecommenderName('');
    setSelectedGenres([]);
    setNewGenre('');
    setIsFavorite(false);
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
              name="pages"
              render={({ field }) => (
                <FormItem className="mt-4">
                  <FormLabel>Number of Pages</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="Number of pages" 
                      min="0"
                      {...field} 
                      onChange={(e) => field.onChange(e.target.value)}
                      className="appearance-auto"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="mt-4">
              <FormLabel>Genres</FormLabel>
              <div className="flex flex-wrap gap-2 mt-2 mb-2">
                {selectedGenres.map(genre => (
                  <Badge 
                    key={genre} 
                    className="px-3 py-1 bg-blue-100 text-blue-800 hover:bg-blue-200"
                    onClick={() => removeGenre(genre)}
                  >
                    {genre} ×
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input 
                  placeholder="Add custom genre" 
                  value={newGenre}
                  onChange={(e) => setNewGenre(e.target.value)}
                  className="flex-grow"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => addGenre(newGenre)}
                  className="whitespace-nowrap"
                >
                  Add Genre
                </Button>
              </div>
              <div className="mt-2">
                <p className="text-sm text-gray-500 mb-1">Popular genres:</p>
                <div className="flex flex-wrap gap-2">
                  {presetGenres.filter(g => !selectedGenres.includes(g)).slice(0, 8).map(genre => (
                    <Badge 
                      key={genre} 
                      variant="outline"
                      className="cursor-pointer hover:bg-blue-50"
                      onClick={() => toggleGenre(genre)}
                    >
                      {genre}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

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

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem className="mt-4">
                  <FormLabel>Reading Status</FormLabel>
                  <Select 
                    onValueChange={(value: any) => handleStatusChange(value)} 
                    value={readingStatus}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="to-read">To Read</SelectItem>
                      <SelectItem value="reading">Currently Reading</SelectItem>
                      <SelectItem value="read">Finished</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="mt-4 flex items-center space-x-2">
              <Checkbox 
                id="favorite" 
                checked={isFavorite}
                onCheckedChange={(checked) => setIsFavorite(checked === true)}
              />
              <label
                htmlFor="favorite"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center"
              >
                <Star className="h-4 w-4 mr-1 text-yellow-400" />
                Mark as favorite
              </label>
            </div>

            {readingStatus !== 'to-read' && (
              <FormField
                control={form.control}
                name="progress"
                render={({ field }) => (
                  <FormItem className="mt-4">
                    <FormLabel className="flex items-center justify-between">
                      <span>Reading Progress</span>
                      <span className="text-sm font-normal">{readingProgress}%</span>
                    </FormLabel>
                    <FormControl>
                      <div className="pt-2">
                        <Slider 
                          defaultValue={[bookToEdit?.progress || 0]} 
                          max={100} 
                          step={1} 
                          value={[readingProgress]}
                          onValueChange={handleProgressChange}
                          className="cursor-pointer"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Verification Code - only show for new books */}
            {!bookToEdit && (
              <div className="mt-4">
                <FormLabel className="flex items-center">
                  <ShieldAlert className="h-4 w-4 mr-1 text-amber-500" />
                  <span>Verification Code</span>
                </FormLabel>
                <Input
                  type="password"
                  placeholder="Enter verification code to add book"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Required to add book to your collection
                </p>
              </div>
            )}

            {/* Recommender Name Input (conditional) */}
            {showRecommenderInput && (
              <div className="mt-4">
                <FormLabel>Your Name</FormLabel>
                <Input
                  placeholder="Enter your name"
                  value={recommenderName}
                  onChange={(e) => setRecommenderName(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Your recommendation will be added to a separate list
                </p>
              </div>
            )}
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
                          "w-32 h-48 border-2 border-dashed rounded-md flex items-center justify-center mb-2 shadow-lg",
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
          <Button type="submit" className="bg-blue-700 hover:bg-blue-800">
            {bookToEdit ? 'Save Changes' : showRecommenderInput ? 'Add Recommendation' : 'Add to Bookshelf'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default AddBookForm;
