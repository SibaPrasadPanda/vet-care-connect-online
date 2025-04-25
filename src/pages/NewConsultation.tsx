
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
      // Generate a proper UUID using our helper function
      const userId = ensureValidUUID(user.id);
      
      console.log("Submitting consultation with data:", {
        userId: userId,
        petName: data.petName,
        symptoms: data.symptoms,
        hasAttachments: data.attachments && data.attachments instanceof FileList && data.attachments.length > 0
      });
      
      // Make sure we have a current Supabase session
      const { data: authData } = await supabase.auth.getSession();
      if (!authData?.session) {
        console.log("No active Supabase session, attempting to create one");
        await supabase.auth.signInAnonymously();
      }
      
      // Create the consultation record - use upsert instead of insert for better compatibility with RLS
      const { error: consultationError, data: newConsultation } = await supabase
        .from('consultations')
        .upsert([
          {
            id: crypto.randomUUID(), // Generate a unique ID for the consultation
            user_id: userId,
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

      // Handle file uploads if any
      if (data.attachments && data.attachments instanceof FileList && data.attachments.length > 0) {
        const fileList = data.attachments as FileList;
        const files = Array.from(fileList);
        
        try {
          // Check if bucket exists
          const { error: bucketError } = await supabase
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
            const fileExt = file.name.split('.').pop();
            const filePath = `${userId}/${newConsultation.id}/${Math.random()}.${fileExt}`;
            
            const { error: uploadError } = await supabase.storage
              .from('consultation-attachments')
              .upload(filePath, file);

            if (uploadError) {
              console.error('Error uploading file:', uploadError);
              throw uploadError;
            }
            return filePath;
          });

          await Promise.all(uploadPromises);
          console.log("Files uploaded successfully");
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
      
      // Handle connection errors
      if (error instanceof Error && error.message.includes('Failed to fetch') || 
          error instanceof TypeError && error.message.includes('network') ||
          error instanceof TypeError && error.message.includes('Failed to fetch')) {
        
        setConnectionError(true);
        toast({
          title: "Connection Error",
          description: "Unable to connect to the server. Please check your internet connection and try again.",
          variant: "destructive"
        });
      } else if (error instanceof Error && error.message.includes('row-level security policy')) {
        // Handle RLS policy errors
        setAuthError(true);
        toast({
          title: "Permission Error",
          description: "You don't have permission to create consultations. Please try logging out and back in.",
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
