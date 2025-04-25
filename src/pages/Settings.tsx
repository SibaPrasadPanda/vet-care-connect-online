
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Settings as SettingsIcon, Calendar, MessageSquare, Clock } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// Define schema for doctor settings form
const doctorSettingsSchema = z.object({
  maxConsultationsPerDay: z.coerce.number().min(0, "Must be 0 or greater").default(5),
  maxAppointmentsPerDay: z.coerce.number().min(0, "Must be 0 or greater").default(8),
  consultationStartTime: z.string().default("09:00"),
  consultationEndTime: z.string().default("17:00"),
  appointmentStartTime: z.string().default("09:00"),
  appointmentEndTime: z.string().default("17:00"),
  daysAvailable: z.array(z.string()).default(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"])
});

type DoctorSettingsFormValues = z.infer<typeof doctorSettingsSchema>;

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const userRole = user?.user_metadata?.role || "";

  const form = useForm<DoctorSettingsFormValues>({
    resolver: zodResolver(doctorSettingsSchema),
    defaultValues: {
      maxConsultationsPerDay: 5,
      maxAppointmentsPerDay: 8,
      consultationStartTime: "09:00",
      consultationEndTime: "17:00",
      appointmentStartTime: "09:00",
      appointmentEndTime: "17:00",
      daysAvailable: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    }
  });

  // Fetch doctor settings on component mount
  useEffect(() => {
    const fetchDoctorSettings = async () => {
      if (!user || userRole !== "doctor") return;

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("doctor_settings")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (error) {
          console.error("Error fetching doctor settings:", error);
          return;
        }

        if (data) {
          // Update form values with the data from database
          form.reset({
            maxConsultationsPerDay: data.max_consultations_per_day,
            maxAppointmentsPerDay: data.max_appointments_per_day,
            consultationStartTime: data.consultation_start_time,
            consultationEndTime: data.consultation_end_time,
            appointmentStartTime: data.appointment_start_time,
            appointmentEndTime: data.appointment_end_time,
            daysAvailable: data.days_available
          });
        }
      } catch (error) {
        console.error("Unexpected error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctorSettings();
  }, [user, userRole, form]);

  const onSubmit = async (values: DoctorSettingsFormValues) => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("doctor_settings")
        .upsert({
          user_id: user.id,
          max_consultations_per_day: values.maxConsultationsPerDay,
          max_appointments_per_day: values.maxAppointmentsPerDay,
          consultation_start_time: values.consultationStartTime,
          consultation_end_time: values.consultationEndTime,
          appointment_start_time: values.appointmentStartTime,
          appointment_end_time: values.appointmentEndTime,
          days_available: values.daysAvailable,
          updated_at: new Date().toISOString()
        }, {
          onConflict: "user_id"
        });

      if (error) {
        console.error("Error saving settings:", error);
        toast({
          title: "Error",
          description: "Failed to save your settings. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Settings Updated",
        description: "Your availability settings have been saved successfully.",
      });

    } catch (error) {
      console.error("Unexpected error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderDoctorSettings = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calendar className="mr-2 h-5 w-5" />
          Doctor Availability Settings
        </CardTitle>
        <CardDescription>
          Configure your availability for consultations and appointments
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <h3 className="font-medium flex items-center">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Consultation Settings
                </h3>
                <FormField
                  control={form.control}
                  name="maxConsultationsPerDay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Consultations Per Day</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormDescription>
                        Set how many online consultations you can handle daily
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="consultationStartTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="consultationEndTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-medium flex items-center">
                  <Clock className="mr-2 h-4 w-4" />
                  In-Person Appointment Settings
                </h3>
                <FormField
                  control={form.control}
                  name="maxAppointmentsPerDay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Appointments Per Day</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormDescription>
                        Set how many in-person appointments you can handle daily
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="appointmentStartTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="appointmentEndTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button 
                type="submit" 
                className="bg-vet-primary hover:bg-vet-dark" 
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );

  const renderGeneralSettings = () => (
    <Card>
      <CardHeader>
        <CardTitle>General Settings</CardTitle>
        <CardDescription>Manage your system preferences</CardDescription>
      </CardHeader>
      <CardContent>
        <p>System settings and configuration will appear here.</p>
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your account and system preferences</p>
        </div>

        <Tabs defaultValue="doctor" className="w-full">
          <TabsList className="mb-4">
            {userRole === "doctor" && (
              <TabsTrigger value="doctor">Doctor Settings</TabsTrigger>
            )}
            <TabsTrigger value="general">General Settings</TabsTrigger>
          </TabsList>
          
          {userRole === "doctor" && (
            <TabsContent value="doctor" className="space-y-6">
              {renderDoctorSettings()}
            </TabsContent>
          )}
          
          <TabsContent value="general" className="space-y-6">
            {renderGeneralSettings()}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
