
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import PublicAccess from "./components/PublicAccess";
import AdminDashboard from "./components/AdminDashboard";
import Login from "./components/Login";
import NotFound from "./pages/NotFound";
import BrandHeader from "./components/BrandHeader";

const queryClient = new QueryClient();

const AppContent = () => {
  const location = useLocation();
  const isDashboard = location.pathname === '/dashboard';

  return (
    <div className="min-h-screen">
      {!isDashboard && (
        <div className="bg-gradient-to-br from-blue-50 to-green-50">
          <div className="pt-8 pb-4">
            <BrandHeader />
          </div>
        </div>
      )}
      
      <div className={!isDashboard ? "bg-gradient-to-br from-blue-50 to-green-50" : ""}>
        <Routes>
          <Route path="/" element={<PublicAccess />} />
          <Route path="/admin" element={<Login />} />
          <Route path="/dashboard" element={<AdminDashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
