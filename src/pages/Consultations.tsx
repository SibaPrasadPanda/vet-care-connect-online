import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar, FileText, Clock, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Consultation } from "@/types/database";
import { supabase } from "@/integrations/supabase/client";

const Consultations = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConsultations = async () => {
      try {
        if (!user?.id) {
          console.log("No authenticated user found");
          setLoading(false);
          return;
        }

        console.log("Fetching consultations for user:", user.id);
        const { data, error } = await supabase
          .from("consultations")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching consultations:", error);
          toast({
            title: "Error",
            description: "Failed to load consultations. Please try again later.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        console.log("Consultations fetched successfully:", data);
        const typedConsultations = data?.map(item => ({
          ...item,
          status: item.status as "pending" | "in_progress" | "completed"
        })) || [];
        
        setConsultations(typedConsultations);
        setLoading(false);
      } catch (error) {
        console.error("Unexpected error fetching consultations:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred. Please try again later.",
          variant: "destructive",
        });
        setLoading(false);
      }
    };

    fetchConsultations();
  }, [user, toast]);

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
      month: "short",
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Consultations</h1>
        <Button onClick={() => navigate("/consultations/new")}>
          <Plus className="mr-2 h-4 w-4" />
          New Consultation
        </Button>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading consultations...</span>
        </div>
      ) : consultations.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {consultations.map((consultation) => (
            <Card key={consultation.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{consultation.pet_name}</CardTitle>
                    <CardDescription className="flex items-center mt-1">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDate(consultation.created_at)}
                    </CardDescription>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(consultation.status)}`}>
                    {getStatusLabel(consultation.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Symptoms</h4>
                    <p className="text-sm">
                      {consultation.symptoms.length > 100
                        ? `${consultation.symptoms.substring(0, 100)}...`
                        : consultation.symptoms}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="h-4 w-4 mr-1" />
                      {consultation.status === "pending" ? "Waiting for vet" : consultation.status==="in_progress" ? "Consultation in progress" : "Consultation completed"}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => navigate(`/consultations/${consultation.id}`)}
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <div className="text-center space-y-3">
              <h3 className="text-xl font-medium">No consultations yet</h3>
              <p className="text-gray-500">
                Start by creating your first virtual consultation request.
              </p>
              <Button onClick={() => navigate("/consultations/new")} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                New Consultation
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
};

export default Consultations;
