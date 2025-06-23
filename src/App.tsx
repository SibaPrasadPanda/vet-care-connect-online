
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Consultations from "./pages/Consultations";
import ConsultationDetails from "./pages/ConsultationDetails";
import NewConsultation from "./pages/NewConsultation";
import Appointments from "./pages/Appointments";
import ScheduleAppointment from "./pages/ScheduleAppointment";
import Prescriptions from "./pages/Prescriptions";
import Pets from "./pages/Pets";
import Visits from "./pages/Visits";
import Cases from "./pages/Cases";
import Users from "./pages/Users";
import AdminDashboard from "./pages/AdminDashboard";
import Schedule from "./pages/Schedule";
import WritePrescription from "./pages/WritePrescription";
import WriteAppointmentPrescription from "./pages/WriteAppointmentPrescription";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/consultations" element={<Consultations />} />
            <Route path="/consultations/:id" element={<ConsultationDetails />} />
            <Route path="/consultations/new" element={<NewConsultation />} />
            <Route path="/appointments" element={<Appointments />} />
            <Route path="/appointments/schedule" element={<ScheduleAppointment />} />
            <Route path="/prescriptions" element={<Prescriptions />} />
            <Route path="/pets" element={<Pets />} />
            <Route path="/visits" element={<Visits />} />
            <Route path="/cases" element={<Cases />} />
            <Route path="/users" element={<Users />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/write-prescription" element={<WritePrescription />} />
            <Route path="/write-appointment-prescription" element={<WriteAppointmentPrescription />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
