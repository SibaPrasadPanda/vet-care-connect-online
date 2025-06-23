
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  emergency_contact: string;
}

export const PersonalInfo = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile>({
    id: "",
    full_name: "",
    email: "",
    phone: "",
    address: "",
    emergency_contact: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfile(data);
      } else {
        // Set default values from auth user
        setProfile({
          id: user.id,
          full_name: user.user_metadata?.name || "",
          email: user.email || "",
          phone: "",
          address: "",
          emergency_contact: "",
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile information",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          full_name: profile.full_name,
          email: profile.email,
          phone: profile.phone,
          address: profile.address,
          emergency_contact: profile.emergency_contact,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
        <CardDescription>
          Manage your personal details and contact information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              value={profile.full_name}
              onChange={(e) => handleInputChange("full_name", e.target.value)}
              disabled={!isEditing}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={profile.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              disabled={!isEditing}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={profile.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              disabled={!isEditing}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="emergency_contact">Emergency Contact</Label>
            <Input
              id="emergency_contact"
              value={profile.emergency_contact}
              onChange={(e) => handleInputChange("emergency_contact", e.target.value)}
              disabled={!isEditing}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Textarea
            id="address"
            value={profile.address}
            onChange={(e) => handleInputChange("address", e.target.value)}
            disabled={!isEditing}
            rows={3}
          />
        </div>
        
        <div className="flex gap-2">
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>
              Edit Profile
            </Button>
          ) : (
            <>
              <Button onClick={handleSave} disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsEditing(false);
                  loadProfile();
                }}
              >
                Cancel
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
