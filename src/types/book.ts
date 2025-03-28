
export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  dateRead: Date;
  color?: string;
  genre?: string;
  status: 'read' | 'reading' | 'to-read';
  order?: number;
  progress: number; // Progress value from 0-100
}
