import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Book } from '@/types/book';

interface GenreData {
  name: string;
  value: number;
  color: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#d88884', '#84d888', '#d884c0'];

interface TopGenresChartProps {
  books: Book[];
}

const TopGenresChart: React.FC<TopGenresChartProps> = ({ books }) => {
  // Calculate genre counts
  const genreCounts: Record<string, number> = {};
  books.forEach(book => {
    if (book.genres && book.genres.length > 0) {
      book.genres.forEach(genre => {
        genreCounts[genre] = (genreCounts[genre] || 0) + 1;
      });
    }
  });
  
  // Convert to data format for Recharts
  const genreData: GenreData[] = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6) // Show only top 6 genres
    .map(([name, value], index) => ({
      name,
      value,
      color: COLORS[index % COLORS.length]
    }));
  
  // If no genres, show placeholder
  if (genreData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-white rounded-xl">
        <p className="text-gray-500">Add books with genres to see statistics</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 h-64">
      <h3 className="text-sm text-gray-500 font-medium mb-4 uppercase text-lg">Top Genres</h3>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={genreData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
            labelLine={false}
          >
            {genreData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value) => [`${value} books`, 'Count']} 
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TopGenresChart; 