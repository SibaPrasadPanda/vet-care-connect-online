
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";

import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Pets from "./pages/Pets";
import Consultations from "./pages/Consultations";
import Prescriptions from "./pages/Prescriptions";
import Appointments from "./pages/Appointments";
import Schedule from "./pages/Schedule";
import Cases from "./pages/Cases";
import WritePrescription from "./pages/WritePrescription";
import Visits from "./pages/Visits";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            
            {/* Patient Routes */}
            <Route path="/pets" element={<Pets />} />
            <Route path="/consultations" element={<Consultations />} />
            <Route path="/prescriptions" element={<Prescriptions />} />
            <Route path="/appointments" element={<Appointments />} />
            
            {/* Doctor Routes */}
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/cases" element={<Cases />} />
            <Route path="/write-prescription" element={<WritePrescription />} />
            
            {/* Agent Routes */}
            <Route path="/visits" element={<Visits />} />
            
            {/* Admin Routes */}
            <Route path="/users" element={<Users />} />
            <Route path="/settings" element={<Settings />} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
