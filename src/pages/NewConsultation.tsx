
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

type ConsultationForm = {
  petName: string;
  symptoms: string;
  attachments: FileList | null;
};

const NewConsultation = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const form = useForm<ConsultationForm>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (data: ConsultationForm) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create a consultation",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // First, create the consultation record
      const { error: consultationError, data: newConsultation } = await supabase
        .from('consultations')
        .insert([
          {
            user_id: user.id,
            pet_name: data.petName,
            symptoms: data.symptoms,
            status: 'pending'
          }
        ])
        .select()
        .single();

      if (consultationError) throw consultationError;

      // Handle file uploads if any
      if (data.attachments && data.attachments.length > 0) {
        const files = Array.from(data.attachments);
        const uploadPromises = files.map(async (file) => {
          const fileExt = file.name.split('.').pop();
          const filePath = `${user.id}/${newConsultation.id}/${Math.random()}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('consultation-attachments')
            .upload(filePath, file);

          if (uploadError) throw uploadError;
          return filePath;
        });

        await Promise.all(uploadPromises);
      }

      toast({
        title: "Consultation Request Submitted",
        description: "A veterinarian will review your case shortly."
      });

      navigate('/consultations');
    } catch (error) {
      console.error('Error submitting consultation:', error);
      toast({
        title: "Error",
        description: "Failed to submit consultation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
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
