
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar, FileText, Clock, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Appointment } from "@/types/database";
import { supabase } from "@/integrations/supabase/client";

const Appointments = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        if (!user?.id) {
          console.log("No authenticated user found");
          setLoading(false);
          return;
        }

        console.log("Fetching appointments for user:", user.id);
        const { data, error } = await supabase
          .from("appointments")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching appointments:", error);
          toast({
            title: "Error",
            description: "Failed to load appointments. Please try again later.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        console.log("Appointments fetched successfully:", data);
        const typedAppointments = data?.map(item => ({
          ...item,
          status: item.status as "pending" | "confirmed" | "cancelled"
        })) || [];
        
        setAppointments(typedAppointments);
        setLoading(false);
      } catch (error) {
        console.error("Unexpected error fetching appointments:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred. Please try again later.",
          variant: "destructive",
        });
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [user, toast]);

  const getStatusBadgeClass = (status: string) => {
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
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const getStatusLabel = (status: string) => {
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
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Appointments</h1>
        <Button onClick={() => navigate("/appointments/schedule")}>
          <Plus className="mr-2 h-4 w-4" />
          Schedule Appointment
        </Button>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading appointments...</span>
        </div>
      ) : appointments.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {appointments.map((appointment) => (
            <Card key={appointment.id} className="overflow-hidden">
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
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(appointment.status)}`}>
                    {getStatusLabel(appointment.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Reason</h4>
                    <p className="text-sm">
                      {appointment.reason.length > 100
                        ? `${appointment.reason.substring(0, 100)}...`
                        : appointment.reason}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="h-4 w-4 mr-1" />
                      {appointment.status === "pending" ? "Waiting for confirmation" : 
                       appointment.status === "confirmed" ? "Visit confirmed" : "Cancelled"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <div className="text-center space-y-3">
              <h3 className="text-xl font-medium">No appointments yet</h3>
              <p className="text-gray-500">
                Schedule your first appointment with our veterinarians.
              </p>
              <Button onClick={() => navigate("/appointments/schedule")} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Schedule Appointment
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
};

export default Appointments;
