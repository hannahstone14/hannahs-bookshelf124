
export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  dateRead: Date;
  color?: string;
  genre?: string;
  status: 'read' | 'reading' | 'to-read';
}
