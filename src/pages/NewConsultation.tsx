import { useState, useEffect } from "react";
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
import { supabase } from "@/integrations/supabase/client";
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

// Function to ensure we always have a valid UUID
const ensureValidUUID = (id: string | undefined): string => {
  if (!id) return crypto.randomUUID();
  
  // Check if the id is already a valid UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(id)) return id;
  
  // If not a UUID, generate a new one - but we'll use a deterministic approach
  // by hashing the original ID to get consistent UUIDs for the same user
  const initialHash = Array.from(id).reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0) | 0;
  }, 0);
  
  // Use the hash to seed a simple PRNG
  const seededRandom = () => {
    // Use a mutable variable for the hash that's incremented
    let seedValue = initialHash;
    const x = Math.sin(seedValue++) * 10000;
    return x - Math.floor(x);
  };
  
  // Generate UUID v4-like string with some determinism based on the original ID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.floor(seededRandom() * 16);
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const NewConsultation = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const [authError, setAuthError] = useState(false);
  
  const form = useForm<ConsultationForm>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      petName: "",
      symptoms: "",
      attachments: undefined,
    },
  });

  // Verify Supabase authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      console.log("Current Supabase session:", data?.session ? "Active" : "None");
      
      if (!data?.session) {
        // If not authenticated with Supabase, try authenticating as anon
        const { error } = await supabase.auth.signInAnonymously();
        
        if (error) {
          console.error("Error signing in anonymously:", error);
          setAuthError(true);
        } else {
          console.log("Signed in anonymously with Supabase");
        }
      }
    };
    
    checkAuth();
  }, []);

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
      const userId = ensureValidUUID(user.id);
      const consultationId = crypto.randomUUID();
      
      console.log("Starting consultation submission...");
      
      // First create the consultation record
      const { error: consultationError, data: newConsultation } = await supabase
        .from('consultations')
        .insert([
          {
            id: consultationId,
            user_id: userId,
            pet_name: data.petName,
            symptoms: data.symptoms,
            status: 'pending'
          }
        ])
        .select()
        .single();

      if (consultationError) {
        console.error('Error creating consultation:', consultationError);
        throw consultationError;
      }

      // Handle file uploads if any
      const uploadedFiles: string[] = [];
      if (data.attachments && data.attachments instanceof FileList && data.attachments.length > 0) {
        const files = Array.from(data.attachments);
        
        for (const file of files) {
          const fileExt = file.name.split('.').pop();
          const filePath = `${userId}/${consultationId}/${crypto.randomUUID()}.${fileExt}`;
          
          const { error: uploadError, data: uploadData } = await supabase.storage
            .from('consultation-attachments')
            .upload(filePath, file);

          if (uploadError) {
            console.error('Error uploading file:', uploadError);
            continue; // Continue with next file if one fails
          }
          
          if (uploadData) {
            uploadedFiles.push(filePath);
          }
        }

        // Update consultation with attachment paths if any were uploaded
        if (uploadedFiles.length > 0) {
          const { error: updateError } = await supabase
            .from('consultations')
            .update({ attachments: uploadedFiles })
            .eq('id', consultationId);

          if (updateError) {
            console.error('Error updating consultation with attachments:', updateError);
          }
        }
      }

      toast({
        title: "Consultation Request Submitted",
        description: `Successfully created consultation${uploadedFiles.length ? ' with ' + uploadedFiles.length + ' attachments' : ''}.`
      });

      navigate('/consultations');
    } catch (error) {
      console.error('Error in consultation submission:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch') || 
            error.message.includes('network') ||
            error.message.includes('Failed to fetch')) {
          setConnectionError(true);
          toast({
            title: "Connection Error",
            description: "Unable to connect to the server. Please check your internet connection.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Error",
            description: error.message || "Failed to submit consultation",
            variant: "destructive"
          });
        }
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

        {authError && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Authentication Error</AlertTitle>
            <AlertDescription>
              Unable to authenticate with the database. This could be due to:
              <ul className="list-disc pl-5 mt-2">
                <li>Missing permissions</li>
                <li>Session expired</li>
                <li>Database configuration issue</li>
              </ul>
              Please try logging out and back in.
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
