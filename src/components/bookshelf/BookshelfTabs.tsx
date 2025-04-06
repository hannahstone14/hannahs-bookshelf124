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
  SortAsc,
  ArrowUpDown
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
import { cn } from '@/lib/utils';

export type ViewTab = 'shelf' | 'list' | 'to-read' | 'recommendations';
export type SortOption = 'title' | 'author' | 'dateRead' | 'progress' | 'favorite';

interface BookshelfTabsProps {
  activeTab: ViewTab;
  onTabChange: (value: string) => void;
  sortBy: SortOption;
  sortOrder: 'asc' | 'desc';
  onSort: (option: SortOption) => void;
}

const BookshelfTabs: React.FC<BookshelfTabsProps> = ({
  activeTab,
  onTabChange,
  sortBy,
  sortOrder,
  onSort
}) => {
  return (
    <div className="mb-6 border-b border-gray-200">
      <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gray-100 p-1 rounded-lg">
          <TabsTrigger 
            value="shelf"
            className={cn(
              "py-2 text-sm font-medium",
              activeTab === 'shelf' ? 'bg-white text-gray-900 shadow-sm rounded-md' : 'text-gray-600 hover:bg-gray-200'
            )}
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Shelf View
          </TabsTrigger>
          <TabsTrigger 
            value="list"
            className={cn(
              "py-2 text-sm font-medium",
              activeTab === 'list' ? 'bg-white text-gray-900 shadow-sm rounded-md' : 'text-gray-600 hover:bg-gray-200'
            )}
          >
            <List className="h-4 w-4 mr-2" />
            List View
          </TabsTrigger>
          <TabsTrigger 
            value="to-read"
            className={cn(
              "py-2 text-sm font-medium",
              activeTab === 'to-read' ? 'bg-white text-gray-900 shadow-sm rounded-md' : 'text-gray-600 hover:bg-gray-200'
            )}
          >
            <Bookmark className="h-4 w-4 mr-2" />
            To Read
          </TabsTrigger>
          <TabsTrigger 
            value="recommendations"
            className={cn(
              "py-2 text-sm font-medium",
              activeTab === 'recommendations' ? 'bg-white text-gray-900 shadow-sm rounded-md' : 'text-gray-600 hover:bg-gray-200'
            )}
          >
            <LightbulbIcon className="h-4 w-4 mr-2" />
            Recommendations
          </TabsTrigger>
        </TabsList>
      </Tabs>
      
      <div className="flex items-center gap-3 w-full mt-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="icon"
              className="border-gray-300 text-gray-600 hover:bg-gray-100 h-10 w-10 ml-auto"
            >
              <ArrowUpDown className="h-4 w-4" />
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
