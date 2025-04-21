
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

type ConsultationForm = {
  petName: string;
  symptoms: string;
  attachments: FileList | null;
};

const NewConsultation = () => {
  const { toast } = useToast();
  const form = useForm<ConsultationForm>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (data: ConsultationForm) => {
    setIsSubmitting(true);
    // In a real app, we would submit to an API
    console.log("Consultation data:", data);
    toast({
      title: "Consultation Request Submitted",
      description: "A veterinarian will review your case shortly."
    });
    setIsSubmitting(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">New Consultation</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Request a Virtual Consultation</CardTitle>
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
                  name="symptoms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Describe the Symptoms</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Please describe your pet's symptoms in detail..."
                          className="min-h-[150px]"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="attachments"
                  render={({ field: { value, onChange, ...field } }) => (
                    <FormItem>
                      <FormLabel>Attach Photos/Videos (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          multiple
                          accept="image/*,video/*"
                          onChange={(e) => onChange(e.target.files)}
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={isSubmitting}>
                  Submit Consultation Request
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default NewConsultation;
