
import React from 'react';
import { 
  BookOpen, 
  List, 
  Bookmark, 
  LightbulbIcon,
  ArrowDown10, 
  ArrowDownAZ, 
  ArrowDownZA, 
  Percent,
  Star,
  SortAsc
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';

export type ViewTab = 'shelf' | 'list' | 'to-read' | 'recommendations';
export type SortOption = 'title' | 'author' | 'dateRead' | 'progress' | 'favorite';

interface BookshelfTabsProps {
  viewTab: ViewTab;
  onTabChange: (value: string) => void;
  sortBy: SortOption;
  sortOrder: 'asc' | 'desc';
  onSort: (option: SortOption) => void;
}

const BookshelfTabs: React.FC<BookshelfTabsProps> = ({
  viewTab,
  onTabChange,
  sortBy,
  sortOrder,
  onSort
}) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-3">
      <div className="flex items-center gap-3 w-full">
        <Tabs 
          defaultValue="shelf" 
          value={viewTab} 
          onValueChange={onTabChange}
          className="w-full md:w-[540px]"
        >
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="shelf" className="data-[state=inactive]:bg-gray-200 data-[state=active]:bg-blue-700 data-[state=active]:text-white">
              <BookOpen className="h-4 w-4 mr-2" />
              Shelf View
            </TabsTrigger>
            <TabsTrigger value="list" className="data-[state=inactive]:bg-gray-200 data-[state=active]:bg-blue-700 data-[state=active]:text-white">
              <List className="h-4 w-4 mr-2" />
              List View
            </TabsTrigger>
            <TabsTrigger value="to-read" className="data-[state=inactive]:bg-gray-200 data-[state=active]:bg-blue-700 data-[state=active]:text-white">
              <Bookmark className="h-4 w-4 mr-2" />
              To Read
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="data-[state=inactive]:bg-gray-200 data-[state=active]:bg-blue-700 data-[state=active]:text-white">
              <LightbulbIcon className="h-4 w-4 mr-2" />
              Recommendations
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="icon"
              className="border-blue-700 text-blue-700 h-12 w-12"
            >
              <SortAsc className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-white z-50">
            <DropdownMenuLabel>Sort by</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => onSort('dateRead')}>
                {sortBy === 'dateRead' && (sortOrder === 'desc' ? <ArrowDown10 className="h-4 w-4 mr-2" /> : <ArrowDown10 className="h-4 w-4 mr-2 rotate-180" />)}
                By Date Read
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSort('title')}>
                {sortBy === 'title' && (sortOrder === 'desc' ? <ArrowDownZA className="h-4 w-4 mr-2" /> : <ArrowDownAZ className="h-4 w-4 mr-2" />)}
                By Title
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSort('author')}>
                {sortBy === 'author' && (sortOrder === 'desc' ? <ArrowDownZA className="h-4 w-4 mr-2" /> : <ArrowDownAZ className="h-4 w-4 mr-2" />)}
                By Author
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSort('progress')}>
                {sortBy === 'progress' && (sortOrder === 'desc' ? <Percent className="h-4 w-4 mr-2" /> : <Percent className="h-4 w-4 mr-2 rotate-180" />)}
                By Progress
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSort('favorite')}>
                {sortBy === 'favorite' && (sortOrder === 'desc' ? <Star className="h-4 w-4 mr-2" /> : <Star className="h-4 w-4 mr-2 opacity-50" />)}
                Favorites First
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default BookshelfTabs;
