
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";

type AppointmentForm = {
  petName: string;
  reason: string;
  preferredDate: Date | undefined;
  preferredTime: string;
};

const ScheduleAppointment = () => {
  const { toast } = useToast();
  const form = useForm<AppointmentForm>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (data: AppointmentForm) => {
    setIsSubmitting(true);
    // In a real app, we would submit to an API
    console.log("Appointment data:", data);
    toast({
      title: "Appointment Request Submitted",
      description: "We'll confirm your appointment time shortly."
    });
    setIsSubmitting(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Schedule an Appointment</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Book a Visit</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="petName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pet Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your pet's name" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason for Visit</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="E.g., Annual checkup, vaccination, etc."
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="preferredDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Preferred Date</FormLabel>
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                        className="rounded-md border"
                      />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="preferredTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={isSubmitting}>
                  Schedule Appointment
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ScheduleAppointment;
