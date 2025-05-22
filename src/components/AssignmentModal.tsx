
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Clock, Calendar, CheckCircle, AlertTriangle } from "lucide-react";
import { diagnoseConsultationAssignment } from "@/utils/assignmentUtils";

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
  const [diagnosingConsultation, setDiagnosingConsultation] = useState(false);
  const [consultationId, setConsultationId] = useState("");
  const [diagnosisResult, setDiagnosisResult] = useState<any>(null);
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

  const handleDiagnoseConsultation = async () => {
    if (!consultationId || consultationId.trim() === "") {
      toast({
        title: "Missing Information",
        description: "Please enter a consultation ID to diagnose.",
        variant: "destructive",
      });
      return;
    }

    setDiagnosingConsultation(true);
    try {
      const result = await diagnoseConsultationAssignment(consultationId);
      setDiagnosisResult(result);
      
      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        });
      } else {
        toast({
          title: "Assignment Issue Found",
          description: "See the diagnosis result for details.",
        });
      }
    } catch (error) {
      console.error("Error diagnosing consultation:", error);
      toast({
        title: "Diagnosis Failed",
        description: "There was an error diagnosing the consultation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDiagnosingConsultation(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign to Available Doctors</DialogTitle>
          <DialogDescription>
            Automatically assign pending consultations and appointments to doctors based on their availability settings.
          </DialogDescription>
        </DialogHeader>
        
        {results ? (
          <div className="py-6">
            <div className="rounded-lg bg-muted p-4">
              <h4 className="mb-2 font-medium flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                Assignment Results
              </h4>
              <div className="space-y-1">
                <p className="text-sm">Consultations assigned: <span className="font-medium">{results.consultations}</span></p>
                <p className="text-sm">Appointments assigned: <span className="font-medium">{results.appointments}</span></p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="py-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="assignment-info">Assignment Information</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    This process will assign all pending consultations and appointments to available doctors based on:
                  </p>
                  <ul className="text-sm text-muted-foreground mt-2 list-disc pl-5 space-y-1">
                    <li className="flex items-center">
                      <Calendar className="h-3 w-3 mr-2 inline" />
                      Doctor's available days
                    </li>
                    <li className="flex items-center">
                      <Clock className="h-3 w-3 mr-2 inline" />
                      Doctor's consultation and appointment hours
                    </li>
                    <li>Doctor's maximum consultations per day setting</li>
                    <li>Doctor's maximum appointments per day setting</li>
                    <li>Consultation and appointment creation dates (oldest first)</li>
                  </ul>
                </div>

                <div className="border-t pt-4">
                  <Label htmlFor="consultation-diagnosis">Diagnose Specific Consultation</Label>
                  <div className="flex mt-2">
                    <input 
                      id="consultation-id" 
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 flex-1 mr-2"
                      placeholder="Enter consultation ID" 
                      value={consultationId}
                      onChange={(e) => setConsultationId(e.target.value)}
                    />
                    <Button onClick={handleDiagnoseConsultation} disabled={diagnosingConsultation} size="sm">
                      {diagnosingConsultation && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Diagnose
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter a consultation ID to check why it's not being assigned to a doctor.
                  </p>
                </div>

                {diagnosisResult && (
                  <div className={`rounded-lg p-4 ${diagnosisResult.success ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
                    <h4 className="mb-2 font-medium flex items-center">
                      {diagnosisResult.success ? (
                        <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
                      )}
                      Diagnosis Result
                    </h4>
                    <p className="text-sm mb-2">{diagnosisResult.message}</p>
                    
                    {diagnosisResult.reasons && diagnosisResult.reasons.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium">Specific issues:</p>
                        <ul className="list-disc pl-5 text-xs space-y-1 mt-1">
                          {diagnosisResult.reasons.map((reason: string, index: number) => (
                            <li key={index}>{reason}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
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
