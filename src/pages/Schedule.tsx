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

const Schedule = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScheduleData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        console.log("Fetching schedule data for doctor:", user.id);

        // Fetch assigned consultations
        const { data: consultationsData, error: consultationsError } = await supabase
          .from("consultations")
          .select("*")
          .eq("doctor_id", user.id)
          .order("created_at", { ascending: false });

        if (consultationsError) {
          console.error("Error fetching consultations:", consultationsError);
        } else {
          const typedConsultations = consultationsData?.map(item => ({
            ...item,
            status: item.status as "pending" | "in_progress" | "completed"
          })) || [];
          setConsultations(typedConsultations);
        }

        // Fetch assigned appointments
        const { data: appointmentsData, error: appointmentsError } = await supabase
          .from("appointments")
          .select("*")
          .eq("doctor_id", user.id)
          .order("preferred_date", { ascending: true });

        if (appointmentsError) {
          console.error("Error fetching appointments:", appointmentsError);
        } else {
          const typedAppointments = appointmentsData?.map(item => ({
            ...item,
            status: item.status as "pending" | "confirmed" | "cancelled"
          })) || [];
          setAppointments(typedAppointments);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching schedule data:", error);
        toast({
          title: "Error",
          description: "Failed to load schedule. Please try again.",
          variant: "destructive",
        });
        setLoading(false);
      }
    };

    fetchScheduleData();
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
        case "confirmed":
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
          return "Awaiting Confirmation";
        case "confirmed":
          return "Confirmed";
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

  const updateConsultationStatus = async (consultationId: string, newStatus: "pending" | "in_progress" | "completed") => {
    try {
      const { error } = await supabase
        .from("consultations")
        .update({ status: newStatus })
        .eq("id", consultationId);

      if (error) {
        console.error("Error updating consultation status:", error);
        toast({
          title: "Error",
          description: "Failed to update consultation status.",
          variant: "destructive",
        });
        return;
      }

      // Update local state
      setConsultations(prev => 
        prev.map(consultation => 
          consultation.id === consultationId 
            ? { ...consultation, status: newStatus }
            : consultation
        )
      );

      toast({
        title: "Success",
        description: "Consultation status updated successfully.",
      });
    } catch (error) {
      console.error("Error updating consultation status:", error);
    }
  };

  const navigateToWritePrescription = (consultationId: string) => {
    window.location.href = `/write-prescription?consultationId=${consultationId}`;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading schedule...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">My Schedule</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{format(new Date(), "EEEE, MMMM dd, yyyy")}</span>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="consultations">
              Consultations ({consultations.length})
            </TabsTrigger>
            <TabsTrigger value="appointments">
              Appointments ({appointments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Consultations</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{consultations.length}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {consultations.filter(c => c.status === "in_progress").length}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{appointments.length}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
                  <Phone className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {appointments.filter(a => a.status === "confirmed").length}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Consultations</CardTitle>
                </CardHeader>
                <CardContent>
                  {consultations.slice(0, 3).length > 0 ? (
                    <div className="space-y-3">
                      {consultations.slice(0, 3).map((consultation) => (
                        <div key={consultation.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <PawPrint className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{consultation.pet_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatDateTime(consultation.created_at)}
                              </p>
                            </div>
                          </div>
                          <Badge className={getStatusBadgeClass(consultation.status, 'consultation')}>
                            {getStatusLabel(consultation.status, 'consultation')}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No consultations assigned yet.</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Appointments</CardTitle>
                </CardHeader>
                <CardContent>
                  {appointments.slice(0, 3).length > 0 ? (
                    <div className="space-y-3">
                      {appointments.slice(0, 3).map((appointment) => (
                        <div key={appointment.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{appointment.pet_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(appointment.preferred_date)} at {appointment.preferred_time}
                              </p>
                            </div>
                          </div>
                          <Badge className={getStatusBadgeClass(appointment.status, 'appointment')}>
                            {getStatusLabel(appointment.status, 'appointment')}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No appointments scheduled yet.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="consultations">
            {consultations.length > 0 ? (
              <div className="grid gap-6">
                {consultations.map((consultation) => (
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
                      
                      <div className="flex gap-2">
                        {consultation.status === "pending" && (
                          <Button 
                            size="sm" 
                            onClick={() => updateConsultationStatus(consultation.id, "in_progress")}
                          >
                            Start Review
                          </Button>
                        )}
                        {consultation.status === "in_progress" && (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateConsultationStatus(consultation.id, "completed")}
                            >
                              Mark Complete
                            </Button>
                            <Button 
                              size="sm"
                              onClick={() => navigateToWritePrescription(consultation.id)}
                            >
                              Write Prescription
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-medium mb-2">No consultations assigned</h3>
                  <p className="text-muted-foreground text-center">
                    Consultations will appear here when they are assigned to you.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="appointments">
            {appointments.length > 0 ? (
              <div className="grid gap-6">
                {appointments.map((appointment) => (
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
                      
                      <div className="text-xs text-muted-foreground">
                        Requested: {formatDateTime(appointment.created_at)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-medium mb-2">No appointments scheduled</h3>
                  <p className="text-muted-foreground text-center">
                    Appointments will appear here when they are assigned to you.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Schedule;
