
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface AssignmentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface AssignmentResult {
  consultations: number;
  appointments: number;
}

export const AssignmentModal = ({ open, onClose, onSuccess }: AssignmentModalProps) => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AssignmentResult | null>(null);
  const { toast } = useToast();

  const handleAssign = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('assign_pending_to_doctors');
      
      if (error) {
        throw error;
      }
      
      // Process the returned data
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        // Check if the data has the expected properties
        if ('consultations' in data && 'appointments' in data) {
          // Convert the values to numbers
          const typedData: AssignmentResult = {
            consultations: Number(data.consultations || 0),
            appointments: Number(data.appointments || 0)
          };
          
          setResults(typedData);
          toast({
            title: "Assignment Complete",
            description: `Successfully assigned ${typedData.consultations || 0} consultations and ${typedData.appointments || 0} appointments to doctors.`,
          });
          
          // Call the success callback after a brief delay to allow the user to see the results
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 2000);
        } else {
          throw new Error("Data returned from function missing required properties");
        }
      } else {
        throw new Error("No data returned from assignment function or unexpected data format");
      }
    } catch (error) {
      console.error("Error during assignment:", error);
      toast({
        title: "Assignment Failed",
        description: "There was an error assigning consultations and appointments. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign to Available Doctors</DialogTitle>
          <DialogDescription>
            Automatically assign pending consultations and appointments to doctors based on their availability settings.
          </DialogDescription>
        </DialogHeader>
        
        {results ? (
          <div className="py-6">
            <div className="rounded-lg bg-muted p-4">
              <h4 className="mb-2 font-medium">Assignment Results</h4>
              <div className="space-y-1">
                <p className="text-sm">Consultations assigned: <span className="font-medium">{results.consultations}</span></p>
                <p className="text-sm">Appointments assigned: <span className="font-medium">{results.appointments}</span></p>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="assignment-info">Assignment Information</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  This process will assign all pending consultations and appointments to available doctors based on:
                </p>
                <ul className="text-sm text-muted-foreground mt-2 list-disc pl-5 space-y-1">
                  <li>Doctor's maximum consultations per day setting</li>
                  <li>Doctor's maximum appointments per day setting</li>
                  <li>Doctor's available days and hours</li>
                  <li>Consultation and appointment creation dates (oldest first)</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          {results ? (
            <Button onClick={onClose}>Close</Button>
          ) : (
            <>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={handleAssign} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? "Assigning..." : "Assign Now"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
