
export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  dateRead: Date;
  color?: string;
  genres?: string[]; // Changed from single genre to array of genres
  status: 'read' | 'reading' | 'to-read' | 'wishlist' | 'recommendation';
  order?: number;
  progress: number; // Progress value from 0-100
  pages: number; // Total number of pages in the book
  recommendedBy?: string; // Person who recommended the book
  favorite: boolean; // New property to mark favorite books
  isSeries: boolean; // New property to mark if book is part of a series
  seriesName?: string; // Optional name of the series
  seriesPosition?: number; // Optional position in the series
  tags?: string[]; // New property for tags that will show as badges
}
