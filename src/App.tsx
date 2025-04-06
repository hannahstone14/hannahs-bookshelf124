import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { BookshelfProvider } from "./context/BookshelfContext";
import { useEffect } from "react";
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebaseConfig';
import Login from './components/Login';
import Header from './components/Header';

// Configure React Query for better caching and retries
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
      staleTime: 30000, // 30 seconds
      gcTime: 300000, // 5 minutes (formerly cacheTime)
      meta: {
        // Use meta for error handling in newer versions of tanstack/react-query
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
    } catch (error) {
      console.error('Error checking localStorage:', error);
    }
    
    return () => {
      console.log('App unmounting, ensuring data is saved');
      // No need to do anything, our hooks handle saving on unmount
    };
  }, []);
  
  return null;
};

// Main App Component with Authentication Handling
const App = () => {
  const [user, loading, error] = useAuthState(auth);

  if (loading) {
    // Optional: Add a loading spinner component
    return <div>Loading...</div>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BookshelfProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <DataPersistenceLogger />
          
          <BrowserRouter>
            <Header />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </BookshelfProvider>
    </QueryClientProvider>
  );
};

export default App;
