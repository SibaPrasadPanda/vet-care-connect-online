
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Calendar, Clock, FileText, MessageSquare, Users, Activity, Plus, AlertCircle, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Consultation, Appointment } from "@/types/database";
import { AdminDashboard } from './AdminDashboard';
import { assignSingleItem } from '@/utils/assignmentUtils';

// New function to assign pending consultations/appointments to doctors
const assignToAvailableDoctors = async () => {
  try {
    // Call the Supabase function to assign consultations and appointments
    const { data, error } = await supabase.rpc('assign_pending_to_doctors');
    
    if (error) {
      console.error("Error assigning to doctors:", error);
      return false;
    }
    
    console.log("Assignment results:", data);
    return true;
  } catch (error) {
    console.error("Unexpected error during assignment:", error);
    return false;
  }
};

const Dashboard = () => {
  const { user } = useAuth();
  
  const userName = user?.user_metadata?.name || 'User';
  const userRole = user?.user_metadata?.role || '';
  
  const renderDashboard = () => {
    switch (userRole) {
      case 'patient':
        return <PatientDashboard userId={user?.id} />;
      case 'doctor':
        return <DoctorDashboard />;
      case 'agent':
        return <AgentDashboard />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return <div>Please log in to view your dashboard.</div>;
    }
  };
  
  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {userName}!
        </p>
      </div>
      
      {renderDashboard()}
    </DashboardLayout>
  );
};

const PatientDashboard = ({ userId }: { userId?: string }) => {
  const [recentConsultations, setRecentConsultations] = useState<Consultation[]>([]);
  const [recentAppointments, setRecentAppointments] = useState<Appointment[]>([]);
  const [activeConsultationsCount, setActiveConsultationsCount] = useState(0);
  const [upcomingAppointmentsCount, setUpcomingAppointmentsCount] = useState(0);
  const [nextAppointmentDate, setNextAppointmentDate] = useState<string | null>(null);
  const [nextAppointmentTime, setNextAppointmentTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!userId) {
          console.log("No authenticated user found");
          setLoading(false);
          return;
        }

        console.log("Fetching recent consultations for user:", userId);
        const { data: consultationsData, error: consultationsError } = await supabase
          .from("consultations")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(3);

        if (consultationsError) {
          console.error("Error fetching consultations:", consultationsError);
          toast({
            title: "Error",
            description: "Failed to load recent consultations.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        console.log("Fetching recent appointments for user:", userId);
        const { data: appointmentsData, error: appointmentsError } = await supabase
          .from("appointments")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(3);

        if (appointmentsError) {
          console.error("Error fetching appointments:", appointmentsError);
          toast({
            title: "Error",
            description: "Failed to load recent appointments.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        // Count active consultations (pending or in_progress)
        const activeConsultations = consultationsData?.filter(
          c => c.status === "pending" || c.status === "in_progress"
        ) || [];
        setActiveConsultationsCount(activeConsultations.length);

        // Count upcoming appointments (pending or confirmed status and future date)
        // Changed here to include pending appointments as well
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const upcomingAppointments = appointmentsData?.filter(appointment => {
          const appointmentDate = new Date(appointment.preferred_date);
          return (
            (appointment.status === "confirmed" || appointment.status === "pending") && 
            appointmentDate >= today
          );
        }) || [];
        
        setUpcomingAppointmentsCount(upcomingAppointments.length);
        
        // Find the next upcoming appointment
        if (upcomingAppointments.length > 0) {
          upcomingAppointments.sort((a, b) => {
            const dateA = new Date(a.preferred_date);
            const dateB = new Date(b.preferred_date);
            return dateA.getTime() - dateB.getTime();
          });
          
          const nextAppointment = upcomingAppointments[0];
          setNextAppointmentDate(nextAppointment.preferred_date);
          setNextAppointmentTime(nextAppointment.preferred_time);
        }

        console.log("Recent consultations fetched successfully:", consultationsData);
        console.log("Recent appointments fetched successfully:", appointmentsData);
        
        const typedConsultations = consultationsData?.map(item => ({
          ...item,
          status: item.status as "pending" | "in_progress" | "completed"
        })) || [];
        
        const typedAppointments = appointmentsData?.map(item => ({
          ...item,
          status: item.status as "pending" | "confirmed" | "cancelled"
        })) || [];
        
        setRecentConsultations(typedConsultations);
        setRecentAppointments(typedAppointments);
        setLoading(false);
      } catch (error) {
        console.error("Unexpected error fetching data:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred.",
          variant: "destructive",
        });
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, toast]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // This is what we'd modify in the actual implementation - when using forms for consultation or appointment creation
  // We'd need to add these functions to the corresponding submission handlers in NewConsultation.tsx and ScheduleAppointment.tsx
  const createConsultation = async (consultationData: any) => {
    try {
      // Insert the consultation
      const { data, error } = await supabase
        .from('consultations')
        .insert([{ ...consultationData, user_id: userId, status: 'pending' }])
        .select()
        .single();
      
      if (error) throw error;
      
      // Try to auto-assign to an available doctor
      const { success, message } = await assignSingleItem();
      
      if (success) {
        toast({
          title: "Consultation Created",
          description: message,
        });
      } else {
        toast({
          title: "Consultation Created",
          description: "Your consultation has been received and will be assigned to a doctor soon.",
        });
      }
      
      return data;
    } catch (error) {
      console.error("Error creating consultation:", error);
      toast({
        title: "Error",
        description: "Failed to create consultation. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };
  
  const scheduleAppointment = async (appointmentData: any) => {
    try {
      // Insert the appointment
      const { data, error } = await supabase
        .from('appointments')
        .insert([{ ...appointmentData, user_id: userId, status: 'pending' }])
        .select()
        .single();
      
      if (error) throw error;
      
      // Try to auto-assign to an available doctor
      const { success, message } = await assignSingleItem();
      
      if (success) {
        toast({
          title: "Appointment Scheduled",
          description: message,
        });
      } else {
        toast({
          title: "Appointment Scheduled",
          description: "Your appointment has been received and will be assigned to a doctor soon.",
        });
      }
      
      return data;
    } catch (error) {
      console.error("Error scheduling appointment:", error);
      toast({
        title: "Error",
        description: "Failed to schedule appointment. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  return (
    <div className="grid gap-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-vet-primary text-primary-foreground">
          <CardHeader className="pb-2">
            <CardTitle className="text-primary-foreground">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button asChild variant="outline" className="w-full bg-white/20 border-white/20 hover:bg-white/30 text-white">
                <Link to="/consultations/new">
                  <Plus className="mr-2 h-4 w-4" />
                  New Consultation
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full bg-white/20 border-white/20 hover:bg-white/30 text-white">
                <Link to="/appointments/schedule">
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule Appointment
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Active Consultations</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeConsultationsCount}</div>
            <p className="text-xs text-muted-foreground">
              {activeConsultationsCount === 1 ? "You have a consultation" : "You have consultations"} waiting for response
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Upcoming Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingAppointmentsCount}</div>
            <p className="text-xs text-muted-foreground">
              {nextAppointmentDate && nextAppointmentTime 
                ? `Next: ${formatDate(nextAppointmentDate)} - ${nextAppointmentTime}`
                : "No upcoming appointments"
              }
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Recent Consultations</h2>
          {loading ? (
            <Card>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ) : recentConsultations.length > 0 ? (
            <div className="space-y-4">
              {recentConsultations.map((consultation) => (
                <Card key={consultation.id} className="hover:bg-muted/50 transition-colors">
                  <CardContent className="p-6 flex justify-between items-center">
                    <div>
                      <div className="font-medium">{consultation.pet_name}</div>
                      <div className="text-sm text-muted-foreground">
                        Symptoms: {consultation.symptoms.substring(0, 100)}...
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(consultation.created_at)}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {consultation.status === "pending" ? (
                        <span className="flex items-center text-sm text-amber-600">
                          <Clock className="h-3 w-3 mr-1" />
                          Active
                        </span>
                      ) : (
                        <span className="flex items-center text-sm text-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Complete
                        </span>
                      )}
                      <Button asChild variant="outline" size="sm">
                        <Link to={`/consultations/${consultation.id}`}>
                          View
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <div className="flex justify-center mt-4">
                <Button asChild variant="outline">
                  <Link to="/consultations">
                    View All Consultations
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">No consultations yet</p>
                <Button asChild variant="outline" className="mt-4">
                  <Link to="/consultations/new">
                    <Plus className="mr-2 h-4 w-4" />
                    New Consultation
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Recent Appointments</h2>
          {loading ? (
            <Card>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ) : recentAppointments.length > 0 ? (
            <div className="space-y-4">
              {recentAppointments.map((appointment) => (
                <Card key={appointment.id} className="hover:bg-muted/50 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{appointment.pet_name}</CardTitle>
                        <CardDescription className="flex items-center mt-1">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(appointment.preferred_date)}
                          <Clock className="h-4 w-4 ml-3 mr-1" />
                          {appointment.preferred_time}
                        </CardDescription>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        appointment.status === "pending" ? "bg-yellow-100 text-yellow-800 border border-yellow-200" :
                        appointment.status === "confirmed" ? "bg-green-100 text-green-800 border border-green-200" :
                        "bg-red-100 text-red-800 border border-red-200"
                      }`}>
                        {appointment.status === "pending" ? "Awaiting Confirmation" :
                         appointment.status === "confirmed" ? "Confirmed" : "Cancelled"}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Reason</h4>
                      <p className="text-sm">
                        {appointment.reason.length > 100
                          ? `${appointment.reason.substring(0, 100)}...`
                          : appointment.reason}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <div className="flex justify-center mt-4">
                <Button asChild variant="outline">
                  <Link to="/appointments">
                    View All Appointments
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">No appointments yet</p>
                <Button asChild variant="outline" className="mt-4">
                  <Link to="/appointments/schedule">
                    <Plus className="mr-2 h-4 w-4" />
                    Schedule Appointment
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [pendingCases, setPendingCases] = useState(0);
  const [todayAppointments, setTodayAppointments] = useState(0);
  const [nextAppointmentTime, setNextAppointmentTime] = useState<string | null>(null);
  const [urgentCases, setUrgentCases] = useState<Array<{
    id: string;
    title: string;
    date: string;
    urgency: string;
    owner: string;
    petName: string;
    petType: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchDoctorData = async () => {
      if (!user?.id) return;

      try {
        // Fetch assigned consultations count
        const { data: consultations, error: consultationsError } = await supabase
          .from("consultations")
          .select("*")
          .eq("doctor_id", user.id)
          .eq("status", "pending");

        if (consultationsError) throw consultationsError;
        
        // Fetch today's appointments
        const today = new Date().toISOString().split('T')[0];
        const { data: appointments, error: appointmentsError } = await supabase
          .from("appointments")
          .select("*")
          .eq("doctor_id", user.id)
          .eq("preferred_date", today)
          .order("preferred_time", { ascending: true });

        if (appointmentsError) throw appointmentsError;
        
        // Update state with fetched data
        setPendingCases(consultations?.length || 0);
        setTodayAppointments(appointments?.length || 0);
        
        if (appointments && appointments.length > 0) {
          setNextAppointmentTime(appointments[0].preferred_time);
        }
        
        // Fetch urgent cases from consultations marked as high priority or recent
        const { data: urgentConsultations, error: urgentError } = await supabase
          .from("consultations")
          .select("*")
          .eq("doctor_id", user.id)
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(5);

        if (urgentError) throw urgentError;

        // Transform consultations into urgent cases format
        const transformedUrgentCases = urgentConsultations?.map(consultation => ({
          id: consultation.id,
          title: consultation.symptoms.length > 50 ? consultation.symptoms.substring(0, 50) + "..." : consultation.symptoms,
          date: new Date(consultation.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
          }) + " - " + getTimeAgo(consultation.created_at),
          urgency: getUrgencyLevel(consultation.symptoms, consultation.created_at),
          owner: "Patient", // We don't have owner name in current schema
          petName: consultation.pet_name,
          petType: "Pet" // We don't have pet type in current schema
        })) || [];
        
        setUrgentCases(transformedUrgentCases);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching doctor data:", error);
        toast({
          title: "Error",
          description: "Failed to load your dashboard data.",
          variant: "destructive",
        });
        setLoading(false);
      }
    };

    fetchDoctorData();
  }, [user, toast]);

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "less than an hour ago";
    if (diffInHours === 1) return "1 hour ago";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return "1 day ago";
    return `${diffInDays} days ago`;
  };

  const getUrgencyLevel = (symptoms: string, createdAt: string) => {
    const urgentKeywords = ['severe', 'emergency', 'critical', 'urgent', 'bleeding', 'pain', 'vomiting', 'lethargy'];
    const hasUrgentSymptoms = urgentKeywords.some(keyword => 
      symptoms.toLowerCase().includes(keyword)
    );
    
    const hoursOld = (new Date().getTime() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
    
    if (hasUrgentSymptoms || hoursOld < 2) return "high";
    if (hoursOld < 12) return "medium";
    return "low";
  };

  return (
    <div className="grid gap-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Pending Cases</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : pendingCases}</div>
            <p className="text-xs text-muted-foreground">
              Requires your attention
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : todayAppointments}</div>
            <p className="text-xs text-muted-foreground">
              {nextAppointmentTime ? `Next at ${nextAppointmentTime}` : "No appointments today"}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Field Visits Requested</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              No field visits assigned
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Cases Completed</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
      </div>
      
      <h2 className="text-xl font-semibold mt-6 mb-4">Recent Cases</h2>
      
      <div className="space-y-4">
        {loading ? (
          <Card>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ) : urgentCases.length > 0 ? (
          urgentCases.map((case_) => (
            <Card key={case_.id} className="hover:bg-muted/50 transition-colors">
              <CardContent className="p-6 flex justify-between items-center">
                <div>
                  <div className="font-medium">{case_.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {case_.petName} • {case_.date}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {case_.urgency === "high" ? (
                    <span className="flex items-center text-sm text-red-600">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      High Priority
                    </span>
                  ) : case_.urgency === "medium" ? (
                    <span className="flex items-center text-sm text-amber-600">
                      <Clock className="h-3 w-3 mr-1" />
                      Medium Priority
                    </span>
                  ) : (
                    <span className="flex items-center text-sm text-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Low Priority
                    </span>
                  )}
                  <Button asChild variant="default" size="sm" className="bg-vet-primary hover:bg-vet-dark">
                    <Link to={`/consultations/${case_.id}`}>
                      Review Now
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No pending cases at the moment</p>
            </CardContent>
          </Card>
        )}
      </div>
      
      <div className="flex justify-center mt-4">
        <Button asChild variant="outline">
          <Link to="/consultations">
            View All Cases
          </Link>
        </Button>
      </div>
    </div>
  );
};

const AgentDashboard = () => {
  return (
    <div className="grid gap-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-vet-primary text-primary-foreground">
          <CardHeader className="pb-2">
            <CardTitle className="text-primary-foreground">Today's Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3 Visits</div>
            <p className="text-sm text-primary-foreground/90 mb-4">
              Next visit in 45 minutes
            </p>
            <Button asChild variant="outline" className="w-full bg-white/20 border-white/20 hover:bg-white/30 text-white">
              <Link to="/schedule">
                <Calendar className="mr-2 h-4 w-4" />
                View Full Schedule
              </Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Pending Assignments</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">
              Waiting for your confirmation
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Completed This Week</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              +3 from last week
            </p>
          </CardContent>
        </Card>
      </div>
      
      <h2 className="text-xl font-semibold mt-6 mb-4">Upcoming Visits</h2>
      
      <div className="space-y-4">
        {[
          { 
            id: "1", 
            address: "123 Main St, Anytown", 
            time: "10:30 AM", 
            owner: "Jennifer Adams", 
            petName: "Whiskers", 
            petType: "Cat",
            reason: "Follow-up examination" 
          },
          { 
            id: "2", 
            address: "456 Oak Avenue, Somecity", 
            time: "1:15 PM", 
            owner: "Robert Johnson", 
            petName: "Max", 
            petType: "Dog",
            reason: "Vaccination and sample collection" 
          },
          { 
            id: "3", 
            address: "789 Pine Road, Otherville", 
            time: "3:45 PM", 
            owner: "Susan Miller", 
            petName: "Goldie", 
            petType: "Fish",
            reason: "Water quality testing" 
          },
        ].map((visit) => (
          <Card key={visit.id} className="hover:bg-muted/50 transition-colors">
            <CardContent className="p-6 flex justify-between items-center">
              <div>
                <div className="font-medium">{visit.time} - {visit.address}</div>
                <div className="text-sm text-muted-foreground">
                  {visit.petName} ({visit.petType}) • Owner: {visit.owner}
                </div>
                <div className="text-sm">{visit.reason}</div>
              </div>
              <div className="flex items-center gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link to={`/visits/${visit.id}/details`}>
                    Details
                  </Link>
                </Button>
                <Button asChild variant="default" size="sm" className="bg-vet-primary hover:bg-vet-dark">
                  <Link to={`/visits/${visit.id}/navigate`}>
                    Navigate
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
