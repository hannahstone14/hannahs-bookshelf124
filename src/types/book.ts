
export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  dateRead: Date;
  color?: string;
  genre?: string;
  status: 'read' | 'reading' | 'to-read' | 'wishlist' | 'recommendation';
  order?: number;
  progress: number; // Progress value from 0-100
  pages: number; // Total number of pages in the book
  recommendedBy?: string; // Person who recommended the book
}
