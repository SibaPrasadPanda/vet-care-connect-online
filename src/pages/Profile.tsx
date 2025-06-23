
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PersonalInfo } from "@/components/profile/PersonalInfo";
import { PetManagement } from "@/components/profile/PetManagement";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Profile = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Profile</h1>
        
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="personal">Personal Information</TabsTrigger>
            <TabsTrigger value="pets">My Pets</TabsTrigger>
          </TabsList>
          
          <TabsContent value="personal" className="space-y-4">
            <PersonalInfo />
          </TabsContent>
          
          <TabsContent value="pets" className="space-y-4">
            <PetManagement />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
