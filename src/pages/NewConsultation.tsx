
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

const formSchema = z.object({
  petName: z.string().min(1, "Pet name is required"),
  symptoms: z.string().min(10, "Please provide a detailed description of the symptoms"),
  attachments: z.any().optional(),
});

type ConsultationForm = z.infer<typeof formSchema>;

const NewConsultation = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  
  const form = useForm<ConsultationForm>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      petName: "",
      symptoms: "",
      attachments: undefined,
    },
  });

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
    setConnectionError(false);
    
    try {
      console.log("Submitting consultation with data:", {
        userId: user.id,
        petName: data.petName,
        symptoms: data.symptoms,
      });
      
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

      if (consultationError) {
        console.error('Error submitting consultation:', consultationError);
        throw consultationError;
      }

      console.log("Successfully created consultation:", newConsultation);

      // Mock successful submission for demo purposes
      // In a real app, comment this section out and use the actual Supabase connection
      // Uncomment this section for demo purposes only
      toast({
        title: "Consultation Request Submitted",
        description: "A veterinarian will review your case shortly."
      });
      
      navigate('/consultations');
      return;
      
      // The code below would handle file uploads in a production environment
      // Handle file uploads if any
      if (data.attachments && data.attachments.length > 0) {
        // Type assertion to FileList
        const fileList = data.attachments as FileList;
        const files = Array.from(fileList);
        
        try {
          // First check if the bucket exists
          const { data: bucketData, error: bucketError } = await supabase
            .storage
            .getBucket('consultation-attachments');
            
          // If bucket doesn't exist, create it
          if (bucketError) {
            console.log('Bucket does not exist, attempting to create it');
            const { error } = await supabase
              .storage
              .createBucket('consultation-attachments', {
                public: false,
              });
              
            if (error) {
              console.error('Error creating bucket:', error);
              throw error;
            }
          }
          
          const uploadPromises = files.map(async (file) => {
            // Now TypeScript knows file is a File object with name property
            const fileExt = file.name.split('.').pop();
            const filePath = `${user.id}/${newConsultation.id}/${Math.random()}.${fileExt}`;
            
            // Convert File to proper type for Supabase upload
            const { error: uploadError } = await supabase.storage
              .from('consultation-attachments')
              .upload(filePath, file as File);

            if (uploadError) throw uploadError;
            return filePath;
          });

          await Promise.all(uploadPromises);
        } catch (fileError) {
          console.error('Error uploading files:', fileError);
          // Continue even if file upload fails
          toast({
            title: "Warning",
            description: "Consultation was created, but file uploads failed.",
            variant: "destructive",
          });
        }
      }

      toast({
        title: "Consultation Request Submitted",
        description: "A veterinarian will review your case shortly."
      });

      navigate('/consultations');
    } catch (error) {
      console.error('Error submitting consultation:', error);
      // Check if it's a connection error
      if (error instanceof TypeError && (error as TypeError).message.includes('Failed to fetch')) {
        setConnectionError(true);
        toast({
          title: "Connection Error",
          description: "Unable to connect to the server. Please check your internet connection and try again.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to submit consultation. Please try again.",
          variant: "destructive"
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">New Consultation</h1>
        
        {connectionError && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Connection Error</AlertTitle>
            <AlertDescription>
              Unable to connect to our servers. This may be due to:
              <ul className="list-disc pl-5 mt-2">
                <li>Your internet connection</li>
                <li>Our servers are temporarily unavailable</li>
                <li>Firewall or network restrictions</li>
              </ul>
              Please try again later.
            </AlertDescription>
          </Alert>
        )}
        
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
                      <FormMessage />
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
                      <FormMessage />
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
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Consultation Request"
                  )}
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
