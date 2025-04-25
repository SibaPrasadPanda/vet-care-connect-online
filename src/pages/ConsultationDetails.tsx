
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar, Clock, ArrowLeft, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Consultation } from "@/types/database";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

const ConsultationDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConsultation = async () => {
      try {
        if (!id) {
          setError("No consultation ID provided");
          setLoading(false);
          return;
        }

        console.log("Fetching consultation details for ID:", id);
        const { data, error } = await supabase
          .from("consultations")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching consultation details:", error);
          setError("Failed to load consultation details.");
          setLoading(false);
          return;
        }

        if (!data) {
          console.log("No consultation found with ID:", id);
          setError("Consultation not found");
          setLoading(false);
          return;
        }

        console.log("Consultation details fetched successfully:", data);
        // Type assertion to handle the status field
        const typedConsultation = {
          ...data,
          status: data.status as "pending" | "in_progress" | "completed"
        };
        
        setConsultation(typedConsultation);
        setLoading(false);
      } catch (error) {
        console.error("Unexpected error fetching consultation details:", error);
        setError("An unexpected error occurred. Please try again later.");
        setLoading(false);
      }
    };

    fetchConsultation();
  }, [id, toast]);

  const getStatusBadgeClass = (status: string) => {
    switch(status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border border-yellow-200";
      case "in_progress":
        return "bg-blue-100 text-blue-800 border border-blue-200";
      case "completed":
        return "bg-green-100 text-green-800 border border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case "pending":
        return "Awaiting Review";
      case "in_progress":
        return "In Progress";
      case "completed":
        return "Completed";
      default:
        return "Unknown";
    }
  };

  return (
    <DashboardLayout>
      <div className="flex items-center mb-6">
        <Button 
          variant="outline" 
          onClick={() => navigate(-1)} 
          className="mr-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Consultation Details</h1>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading consultation details...</span>
        </div>
      ) : error ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <div className="text-center space-y-3">
              <h3 className="text-xl font-medium text-red-500">{error}</h3>
              <Button onClick={() => navigate("/consultations")} className="mt-4">
                Return to Consultations
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : consultation ? (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">{consultation.pet_name}</CardTitle>
                <div className="flex items-center mt-1 text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-1" />
                  {formatDate(consultation.created_at)}
                </div>
              </div>
              <Badge className={`px-3 py-1 ${getStatusBadgeClass(consultation.status)}`}>
                {getStatusLabel(consultation.status)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Symptoms</h3>
              <div className="p-4 bg-muted rounded-md whitespace-pre-wrap">
                {consultation.symptoms}
              </div>
            </div>
            
            {consultation.attachments && consultation.attachments.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Attachments</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {consultation.attachments.map((attachment, index) => (
                    <div key={index} className="border rounded-md p-2 flex items-center">
                      <FileText className="h-5 w-5 mr-2 text-muted-foreground" />
                      <a 
                        href={attachment} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline truncate"
                      >
                        Attachment {index + 1}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {consultation.status === "completed" ? (
              <div>
                <h3 className="text-lg font-semibold mb-2">Veterinarian Response</h3>
                <div className="p-4 bg-green-50 border border-green-100 rounded-md">
                  <p className="text-muted-foreground">
                    This consultation has been completed. The veterinarian's response should appear here.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-md flex items-center">
                <Clock className="h-5 w-5 mr-2 text-yellow-600" />
                <p className="text-yellow-800">
                  {consultation.status === "pending" 
                    ? "Your consultation is pending review by a veterinarian." 
                    : "Your consultation is currently being reviewed by a veterinarian."}
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-end pt-4 border-t">
            {consultation.status === "completed" && (
              <Button 
                variant="outline" 
                className="mr-2"
                onClick={() => navigate("/prescriptions")}
              >
                View Prescriptions
              </Button>
            )}
            <Button 
              onClick={() => navigate("/consultations")}
              variant="default"
            >
              Back to Consultations
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <div className="text-center text-red-500">
          Something went wrong. Please try again.
        </div>
      )}
    </DashboardLayout>
  );
};

export default ConsultationDetails;
