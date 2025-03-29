
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { BookshelfProvider } from "./context/BookshelfContext";
import { useEffect } from "react";
import * as storageService from "./services/storageService";

// Create and configure QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30000, // Consider data fresh for 30 seconds
    },
  },
});

// Cleanup function to ensure we start with clean data
const cleanupStorage = () => {
  console.log("Initial app cleanup");
  storageService.purgeTestBooks();
  
  // Attempt to recover any data from localStorage if needed
  try {
    const storedBooks = localStorage.getItem('books');
    if (storedBooks) {
      console.log(`Found ${JSON.parse(storedBooks).length} books in localStorage during app initialization`);
    } else {
      console.log('No books found in localStorage during app initialization');
    }
  } catch (error) {
    console.error('Error checking localStorage during app initialization:', error);
  }
};

const App = () => {
  // Run cleanup when the app starts
  useEffect(() => {
    cleanupStorage();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BookshelfProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          
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
};

export default App;
