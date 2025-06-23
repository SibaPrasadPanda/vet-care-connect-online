import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Calendar, Save } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Appointment } from "@/types/database";

const WriteAppointmentPrescription = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [prescription, setPrescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Get appointment ID from URL params or state
  const appointmentId = new URLSearchParams(location.search).get('appointmentId') || location.state?.appointmentId;

  useEffect(() => {
    const fetchAppointment = async () => {
      if (!appointmentId) {
        toast({
          title: "Error",
          description: "No appointment ID provided.",
          variant: "destructive",
        });
        navigate("/schedule");
        return;
      }

      try {
        const { data, error } = await supabase
          .from("appointments")
          .select("*")
          .eq("id", appointmentId)
          .eq("doctor_id", user?.id)
          .single();

        if (error) {
          console.error("Error fetching appointment:", error);
          toast({
            title: "Error",
            description: "Failed to load appointment details.",
            variant: "destructive",
          });
          navigate("/schedule");
          return;
        }

        const typedAppointment = {
          ...data,
          status: data.status as "pending" | "assigned" | "completed" | "cancelled"
        };

        setAppointment(typedAppointment);
        setPrescription(typedAppointment.prescription || "");
        setLoading(false);
      } catch (error) {
        console.error("Error fetching appointment:", error);
        toast({
          title: "Error",
          description: "Failed to load appointment details.",
          variant: "destructive",
        });
        navigate("/schedule");
      }
    };

    if (user?.id) {
      fetchAppointment();
    }
  }, [appointmentId, user?.id, toast, navigate]);

  const handleSavePrescription = async () => {
    if (!appointment || !prescription.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prescription before saving.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ 
          prescription: prescription.trim(),
          status: "completed"
        })
        .eq("id", appointment.id);

      if (error) {
        console.error("Error saving prescription:", error);
        toast({
          title: "Error",
          description: "Failed to save prescription.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Prescription saved successfully and appointment marked as completed.",
      });

      navigate("/schedule");
    } catch (error) {
      console.error("Error saving prescription:", error);
      toast({
        title: "Error",
        description: "Failed to save prescription.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading appointment...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (!appointment) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-4">Appointment not found</h2>
          <Button onClick={() => navigate("/schedule")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Schedule
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/schedule")}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Write Prescription for Appointment</h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Appointment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Pet Name</h4>
                <p className="font-medium">{appointment.pet_name}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Status</h4>
                <Badge variant="secondary">{appointment.status}</Badge>
              </div>
              
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Date & Time</h4>
                <p className="text-sm">{appointment.preferred_date} at {appointment.preferred_time}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Reason for Visit</h4>
                <p className="text-sm bg-muted p-3 rounded-md">{appointment.reason}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Scheduled</h4>
                <p className="text-sm">{new Date(appointment.created_at).toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Prescription</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="prescription" className="block text-sm font-medium mb-2">
                  Prescription Details
                </label>
                <Textarea
                  id="prescription"
                  placeholder="Enter prescription details, medication dosage, instructions, etc..."
                  value={prescription}
                  onChange={(e) => setPrescription(e.target.value)}
                  className="min-h-[200px]"
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleSavePrescription}
                  disabled={saving || !prescription.trim()}
                  className="flex items-center gap-2"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Prescription & Complete
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => navigate("/schedule")}
                  disabled={saving}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default WriteAppointmentPrescription;
