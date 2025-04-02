
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { BookshelfProvider } from "./context/BookshelfContext";
import { useEffect } from "react";

// Configure React Query for better caching and retries
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,  // Increase retries
      refetchOnWindowFocus: false,
      staleTime: 60000, // 1 minute
      gcTime: 300000, // 5 minutes (formerly cacheTime)
      meta: {
        onError: (error: any) => {
          console.error('Query error:', error);
        }
      }
    },
  },
});

// Log when the app initializes
const DataPersistenceLogger = () => {
  useEffect(() => {
    console.log('App initialized, checking localStorage data');
    try {
      const books = localStorage.getItem('books');
      const recommendations = localStorage.getItem('recommendations');
      console.log(`Found ${books ? JSON.parse(books).length : 0} books and ${recommendations ? JSON.parse(recommendations).length : 0} recommendations in localStorage`);
      
      // Log window location for debugging
      console.log('Window location:', window.location.href);
      console.log('Path:', window.location.pathname);
    } catch (error) {
      console.error('Error checking localStorage:', error);
    }
    
    return () => {
      console.log('App unmounting, ensuring data is saved');
    };
  }, []);
  
  return null;
};

// App with basename set to root
const App = () => (
  <QueryClientProvider client={queryClient}>
    <BookshelfProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <DataPersistenceLogger />
        
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </BookshelfProvider>
  </QueryClientProvider>
);

export default App;
