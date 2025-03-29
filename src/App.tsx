
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { BookshelfProvider } from "./context/BookshelfContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

// Check if Supabase is configured
const isSupabaseConfigured = 
  import.meta.env.VITE_SUPABASE_URL && 
  import.meta.env.VITE_SUPABASE_ANON_KEY;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BookshelfProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        
        {!isSupabaseConfigured && (
          <Alert variant="warning" className="max-w-6xl mx-auto my-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Supabase Not Configured</AlertTitle>
            <AlertDescription>
              The app is running in local storage mode because Supabase environment variables are missing. 
              Books will be saved to your browser's localStorage and won't be shared with others.
              To enable multi-user functionality, please set up VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.
            </AlertDescription>
          </Alert>
        )}
        
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
