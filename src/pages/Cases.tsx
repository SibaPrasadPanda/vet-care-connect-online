
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, Clock, User, PawPrint, FileText, Phone } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Consultation, Appointment } from "@/types/database";
import { format, isToday, isTomorrow, parseISO } from "date-fns";

const Cases = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [allConsultations, setAllConsultations] = useState<Consultation[]>([]);
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  const [personalConsultations, setPersonalConsultations] = useState<Consultation[]>([]);
  const [personalAppointments, setPersonalAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCasesData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        console.log("Fetching all cases data");

        // Fetch all consultations
        const { data: allConsultationsData, error: allConsultationsError } = await supabase
          .from("consultations")
          .select("*")
          .order("created_at", { ascending: false });

        if (allConsultationsError) {
          console.error("Error fetching all consultations:", allConsultationsError);
        } else {
          const typedAllConsultations = allConsultationsData?.map(item => ({
            ...item,
            status: item.status as "pending" | "in_progress" | "completed"
          })) || [];
          setAllConsultations(typedAllConsultations);
          
          // Filter personal consultations
          const personalConsults = typedAllConsultations.filter(consultation => 
            consultation.doctor_id === user.id
          );
          setPersonalConsultations(personalConsults);
        }

        // Fetch all appointments
        const { data: allAppointmentsData, error: allAppointmentsError } = await supabase
          .from("appointments")
          .select("*")
          .order("preferred_date", { ascending: true });

        if (allAppointmentsError) {
          console.error("Error fetching all appointments:", allAppointmentsError);
        } else {
          const typedAllAppointments = allAppointmentsData?.map(item => ({
            ...item,
            status: item.status as "pending" | "assigned" | "completed" | "cancelled"
          })) || [];
          setAllAppointments(typedAllAppointments);
          
          // Filter personal appointments
          const personalAppts = typedAllAppointments.filter(appointment => 
            appointment.doctor_id === user.id
          );
          setPersonalAppointments(personalAppts);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching cases data:", error);
        toast({
          title: "Error",
          description: "Failed to load cases. Please try again.",
          variant: "destructive",
        });
        setLoading(false);
      }
    };

    fetchCasesData();
  }, [user, toast]);

  const getStatusBadgeClass = (status: string, type: 'consultation' | 'appointment') => {
    if (type === 'consultation') {
      switch(status) {
        case "pending":
          return "bg-yellow-100 text-yellow-800 border border-yellow-200";
        case "in_progress":
          return "bg-blue-100 text-blue-800 border border-blue-200";
        case "completed":
          return "bg-green-100 text-green-800 border border-green-200";
        default:
          return "bg-gray-100 text-gray-800 border border-gray-200";
      }
    } else {
      switch(status) {
        case "pending":
          return "bg-yellow-100 text-yellow-800 border border-yellow-200";
        case "assigned":
          return "bg-blue-100 text-blue-800 border border-blue-200";
        case "completed":
          return "bg-green-100 text-green-800 border border-green-200";
        case "cancelled":
          return "bg-red-100 text-red-800 border border-red-200";
        default:
          return "bg-gray-100 text-gray-800 border border-gray-200";
      }
    }
  };

  const getStatusLabel = (status: string, type: 'consultation' | 'appointment') => {
    if (type === 'consultation') {
      switch(status) {
        case "pending":
          return "Awaiting Review";
        case "in_progress":
          return "In Progress";
        case "completed":
          return "Completed";
        default:
          return "Unknown";
      }
    } else {
      switch(status) {
        case "pending":
          return "Awaiting Assignment";
        case "assigned":
          return "Assigned to Doctor";
        case "completed":
          return "Completed";
        case "cancelled":
          return "Cancelled";
        default:
          return "Unknown";
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = parseISO(dateString);
    if (isToday(date)) {
      return "Today";
    } else if (isTomorrow(date)) {
      return "Tomorrow";
    } else {
      return format(date, "MMM dd, yyyy");
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = parseISO(dateString);
    return format(date, "MMM dd, yyyy 'at' h:mm a");
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading cases...</span>
        </div>
      </DashboardLayout>
    );
  }

  const renderConsultationCard = (consultation: Consultation) => (
    <Card key={consultation.id}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <PawPrint className="h-5 w-5" />
              {consultation.pet_name}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Submitted: {formatDateTime(consultation.created_at)}
            </p>
            {consultation.doctor_id && (
              <p className="text-sm text-muted-foreground">
                Doctor ID: {consultation.doctor_id}
              </p>
            )}
          </div>
          <Badge className={getStatusBadgeClass(consultation.status, 'consultation')}>
            {getStatusLabel(consultation.status, 'consultation')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">Symptoms</h4>
          <p className="text-sm text-muted-foreground">{consultation.symptoms}</p>
        </div>
        
        {consultation.prescription && (
          <div>
            <h4 className="font-medium mb-2">Prescription</h4>
            <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
              {consultation.prescription}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderAppointmentCard = (appointment: Appointment) => (
    <Card key={appointment.id}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {appointment.pet_name}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {formatDate(appointment.preferred_date)} at {appointment.preferred_time}
            </p>
            {appointment.doctor_id && (
              <p className="text-sm text-muted-foreground">
                Doctor ID: {appointment.doctor_id}
              </p>
            )}
          </div>
          <Badge className={getStatusBadgeClass(appointment.status, 'appointment')}>
            {getStatusLabel(appointment.status, 'appointment')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">Reason for Visit</h4>
          <p className="text-sm text-muted-foreground">{appointment.reason}</p>
        </div>
        
        {appointment.prescription && (
          <div>
            <h4 className="font-medium mb-2">Prescription</h4>
            <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
              {appointment.prescription}
            </p>
          </div>
        )}
        
        <div className="text-xs text-muted-foreground">
          Requested: {formatDateTime(appointment.created_at)}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Patient Cases</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span>All system cases and personal assignments</span>
          </div>
        </div>

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Cases</TabsTrigger>
            <TabsTrigger value="personal">Personal</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Consultations</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{allConsultations.length}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Consultations</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {allConsultations.filter(c => c.status === "pending").length}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{allAppointments.length}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Appointments</CardTitle>
                  <Phone className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {allAppointments.filter(a => a.status === "pending").length}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="consultations" className="space-y-4">
              <TabsList>
                <TabsTrigger value="consultations">
                  All Consultations ({allConsultations.length})
                </TabsTrigger>
                <TabsTrigger value="appointments">
                  All Appointments ({allAppointments.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="consultations">
                {allConsultations.length > 0 ? (
                  <div className="grid gap-6">
                    {allConsultations.map(renderConsultationCard)}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-10">
                      <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-xl font-medium mb-2">No consultations found</h3>
                      <p className="text-muted-foreground text-center">
                        No consultations have been submitted yet.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="appointments">
                {allAppointments.length > 0 ? (
                  <div className="grid gap-6">
                    {allAppointments.map(renderAppointmentCard)}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-10">
                      <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-xl font-medium mb-2">No appointments found</h3>
                      <p className="text-muted-foreground text-center">
                        No appointments have been scheduled yet.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="personal" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">My Consultations</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{personalConsultations.length}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {personalConsultations.filter(c => c.status === "in_progress").length}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">My Appointments</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{personalAppointments.length}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed</CardTitle>
                  <Phone className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {personalAppointments.filter(a => a.status === "completed").length}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="consultations" className="space-y-4">
              <TabsList>
                <TabsTrigger value="consultations">
                  My Consultations ({personalConsultations.length})
                </TabsTrigger>
                <TabsTrigger value="appointments">
                  My Appointments ({personalAppointments.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="consultations">
                {personalConsultations.length > 0 ? (
                  <div className="grid gap-6">
                    {personalConsultations.map(renderConsultationCard)}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-10">
                      <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-xl font-medium mb-2">No personal consultations</h3>
                      <p className="text-muted-foreground text-center">
                        You don't have any consultations assigned to you yet.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="appointments">
                {personalAppointments.length > 0 ? (
                  <div className="grid gap-6">
                    {personalAppointments.map(renderAppointmentCard)}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-10">
                      <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-xl font-medium mb-2">No personal appointments</h3>
                      <p className="text-muted-foreground text-center">
                        You don't have any appointments assigned to you yet.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Cases;
